const db = require("../models");
const Resize = require("../_helpers/resize");
const path = require("path");
const Places = require("google-places-web").default;
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const FileService = require('./FileService')
const fetch = require("node-fetch");
const util = require("util");
const writeFile = util.promisify(fs.writeFile);
const faker = require('faker');
const Chance = require('chance');
const chance = new Chance();
const AWS = require('aws-sdk');

Places.apiKey = process.env.GOOGLE_DEV_KEY
Places.debug = true

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function getGoogleImgUrl(photo_reference) {
  try {
    const url = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=" + photo_reference +  "&sensor=false&key=" + process.env.GOOGLE_DEV_KEY
    const response = await fetch(url);
    const buffer = await response.buffer();
    const folder = path.join(__dirname, "/../public/images/")
    const fileName = uuidv4() + '.jpg'
    await writeFile(folder + fileName, buffer);
    await FileService.uploadFileToAWS(fileName)
    await fs.unlinkSync(folder + fileName)
    return fileName
  } catch (e) {
    console.log(e)
  }
}

async function createGooglePlacesFromNearbySearchResponse(responses, city, country) {
  for (const result of responses) {
    if (result.business_status === 'OPERATIONAL') {
      try {
        // const details = await Places.details({ placeid: result.place_id})
        const img = await getGoogleImgUrl(result.photos[0].photo_reference)
        db.GooglePlaces.create({
          location: { type: 'Point', coordinates: [result.geometry.location.lat,result.geometry.location.lng]},
          types: result.types,
          name: result.name,
          img: img,
          placeId: result.place_id,
          rating: result.rating,
          city: city,
          country: country,
          icon: result.icon,
          vicinity: result.vicinity,
          user_ratings_total: result.user_ratings_total
        })
      } catch (e) {
        console.log(e)
      }
    }
  }
}

function getPlaces(config) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      let response
      try {
        response =await Places.nearbysearch(config);
      } catch (e) {
        console.log(e)
      }
      resolve(response)
    }, 2000)
  });
}

const createGooglePlaces = async (req, res) => {
  try {
    let { lat, long, radius, type, rankby, keyword, nrOfResults, city, country } = req.body
    nrOfResults = Number(nrOfResults)
    let responses = []
    let nextPageToken
    if (nrOfResults > 0) {
      const response = await getPlaces({
        location: lat + ',' + long, // LatLon delimited by ,
        radius: radius,  // Radius cannot be used if rankBy set to DISTANCE
        rankby: rankby,
        type: type,
        ...(keyword && keyword.length > 0 ? { keyword } : {})
      })
      responses = responses.concat(response.results)
      nrOfResults = nrOfResults - 1
      nextPageToken = response.next_page_token
    }
    if (nrOfResults > 0) {
      console.log('NEXT PAGE TOKEN: ' + nextPageToken)
      const response = await getPlaces({
        location: lat + ',' + long, // LatLon delimited by ,
        radius: radius,  // Radius cannot be used if rankBy set to DISTANCE
        type: type, // Undefined type will return all types
        rankby: rankby, // See google docs for different possible values
        keyword: keyword,
        pagetoken: nextPageToken
      });
      responses = responses.concat(response.results)
      nrOfResults = nrOfResults - 1
      nextPageToken = response.next_page_token
    }
    if (nrOfResults > 0) {
      console.log('NEXT PAGE TOKEN: ' + nextPageToken)
      const response = await getPlaces({
        location: lat + ',' + long, // LatLon delimited by ,
        radius: radius,  // Radius cannot be used if rankBy set to DISTANCE
        type: type, // Undefined type will return all types
        rankby: rankby, // See google docs for different possible values
        keyword: keyword,
        pagetoken: nextPageToken
      });
      responses = responses.concat(response.results)
    }
    await createGooglePlacesFromNearbySearchResponse(responses, city, country)
    return res.json(responses)
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const googlePlacesToVenues = async (req, res) => {
  try {
    const places = await db.GooglePlaces.findAll({ raw: true })
    for (const place of places) {
      try {
        var clone = Object.assign({}, {...place});
        delete clone.id
        const venue = await db.Venue.create(clone)
      } catch (e) {
        console.log(e)
      }
    }
    db.GooglePlaces.destroy({
      where: {},
      truncate: true
    })
    return res.json("FINISHED")
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const languageFileProperties = async (req, res) => {
  try {
    let properties = await db.Internalization.findAll({ where: { language: 'English' } })

    let otherProperties = await db.Internalization.findAll({ where: { language: { [db.Sequelize.Op.ne]: 'English' } } })
    properties = properties.map(prop => {
      let otherProps = otherProperties.filter(otherProp => otherProp.i18nName === prop.i18nName)
      let res = { i18nName: prop.i18nName, oldName: prop.name, English: prop.name }
      if (otherProps && otherProps.length > 0) {
        otherProps.forEach(otherProp => {
          res[otherProp.language] = otherProp.name
        })
      }
      return res
    })
    return res.json(properties)
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const newLanguageFile = async (req, res) => {
  try {
    let itemsToSave = []
    req.body.forEach(excelRow => {
      let propsToSave = Object.keys(excelRow).filter(e => !['i18nName', 'oldName'].includes(e))
      propsToSave.forEach(propToSave => {
        itemsToSave.push({ language: propToSave, name: excelRow[propToSave], i18nName: excelRow.i18nName })
      })
    })
    await db.Internalization.destroy({ where: { } })
    await db.Internalization.bulkCreate(itemsToSave)
    return res.json('CREATED')
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const serveFakeUserMatches = async (req, res) => {
  try {
    let query = `
        select
            u1.id as user1Id, u1."firstName" as user1FirstName, u1."lastName" as user1LastName,
            u2.id as user2Id, u2."firstName" as user2FirstName, u2."lastName" as user2LastName,
            um."user2Response" as matched, um."employeeId" as employeeid, um.id as matchid
        from "UserMatches" um
                 join "Users" u1 on u1.id = um."user1Id"
                 join "Users" u2 on u2.id = um."user2Id"
        where u2.role = 'FAKE_USER' and um."user1Response" = true
    `
    if (req.query.searchText) {
      query += ` and (u1."firstName" LIKE '%' || :searchText || '%' or u1."lastName" LIKE '%' || :searchText || '%')
        order by um."createdAt" desc `
      if (req.query.serviceArea) {
        query += ` and u1.iso = :serviceArea `
      }
    } else {
      if (req.query.serviceArea) {
        query += ` and u1.iso = :serviceArea `
      }
      query += ` order by um."createdAt" desc `
    }


    const queryResult = await db.sequelize.query(query, { replacements: { searchText: req.query.searchText, serviceArea: req.query.serviceArea }})
    let fakeMatches = []
    queryResult[0].forEach(queryResult => {
      let foundMatch = fakeMatches.find(fakeMatch => {
        return fakeMatch.userId === queryResult.user1id
      })
      if (!foundMatch) {
        fakeMatches.push({
          userId: queryResult.user1id,
          name: queryResult.user1firstname + ' ' + queryResult.user1lastname,
          fakeSwipes: [{
            userId: queryResult.user1id,
            name: queryResult.user2firstname + ' ' + queryResult.user2lastname,
            matchId: queryResult.matchid,
            employeeId: queryResult.employeeid,
            matched: queryResult.matched == null ? 'Please select an employee' : queryResult.matched
          }]
        })
      } else if (foundMatch) {
        foundMatch.fakeSwipes.push({
          userId: queryResult.user1id,
          name: queryResult.user2firstname + queryResult.user2lastname,
          matchId: queryResult.matchid,
          employeeId: queryResult.employeeid,
          matched: queryResult.matched == null ? 'Please select an employee' : queryResult.matched
        })
      }
    })
    let result = fakeMatches.map(e => {
      return {
        ...e,
        fakeSwipes: e.fakeSwipes.sort(() => Math.random() - 0.5).slice(0, 3)
      }
    })
    result = result.slice(Number(req.query.skip), Number(req.query.limit) + Number(req.query.skip))
    return res.json(result)
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const occupations = ['Mechanic', 'Porn Star', 'Cook', 'Procrastinator', null, null]
const highestEducations = ['HIGH_SCHOOL', 'COLLEGE', 'UNIVERSITY', 'POST_GRAD', null, null]

const generateFakeUsers = async (req, res) => {
  try {
    let { users, serviceAreaName, countries, gender } = req.body
    console.log('GENERATING FAKE USERS')
    const serviceArea = await db.ServiceArea.findOne({where: { iso: serviceAreaName }})
    let _countries = []
    let _weights = []
    countries.forEach(e => {
      _countries.push({ ...e, weight: Number(e.weight) })
      _weights.push(Number(e.weight))
    })
    for (const e of users) {
      let images = []
      if (e.image1) images.push(e.image1)
      if (e.image2) images.push(e.image2)
      if (e.image3) images.push(e.image3)
      if (e.image4) images.push(e.image4)
      if (e.image5) images.push(e.image5)
      const user = await db.User.create({
        ...e,
        highlights: e.highlight,
        lastName: 'I AM FAKE_USER',
        height: faker.random.number({'min': 155, 'max': 180}),
        phoneNumber: faker.phone.phoneNumber(),
        serviceArea: serviceArea.id,
        swipeIso: serviceArea.iso,
        swipeCountry: serviceArea.label,
        freezeLocation: false,
        iso: serviceArea.iso,
        country: serviceArea.label,
        // occupation: faker.random.arrayElement(occupations),
        highestEducation: faker.random.arrayElement(highestEducations),
        hasChildren: false,
        martialStatus: 'SINGLE',
        role: 'FAKE_USER',
        state: 'ON_BOARDED',
        verificationStatus: 'VERIFIED',
        bornAt: faker.date.between('1990-01-01', '2000-01-01'),
        gender: gender,
        images: images,
        swipesLeft: 33
      })

      let interests = await db.Interest.findAll()
      let loadedInterests = []
      Array.from(Array(faker.random.number({ min: 2, max: 6 }))).forEach(e => {
        let random = faker.random.arrayElement(interests)
        if (!loadedInterests.some(e => e.id === random.id)) {
          loadedInterests.push(random)
        }
      })
      loadedInterests.forEach(e => {
        db.UserInterest.create({
          i18nName: e.i18nName,
          icon: e.icon,
          UserId: user.id
        })
      })

      await db.UserLanguage.create({name: 'English', UserId: user.id})
      if (serviceArea.languageSpoken !== 'English') {
        await db.UserLanguage.create({
          name: serviceArea.languageSpoken,
          UserId: user.id
        })
      }

      await db.UserCountry.create({name: serviceArea.iso, UserId: user.id})
      let firstCountry = chance.weighted(_countries, _weights)
      if (firstCountry.name !== serviceArea.iso) {
        await db.UserCountry.create({
          name: firstCountry.name,
          UserId: user.id
        })
      }
      if (serviceArea.languageSpoken !== firstCountry.lang) {
        await db.UserLanguage.create({
          name: firstCountry.lang,
          UserId: user.id
        })
      }

      if (faker.random.arrayElement([true,false, false, false])) { // RANDOMIZE SECOND COUNTRY OF ORIGIN
        let secondCountry = chance.weighted(_countries, _weights)
        while (firstCountry.name === secondCountry.name || secondCountry.name === serviceArea.iso) {
          secondCountry = chance.weighted(_countries, _weights)
        }
        await db.UserCountry.create({
          name: secondCountry.name,
          UserId: user.id
        })
        if (serviceArea.languageSpoken !== secondCountry.lang) {
          await db.UserLanguage.create({
            name: secondCountry.lang,
            UserId: user.id
          })
        }
      }

    }

    return res.json('CREATED')
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const serveEmployees = async (req, res) => {
  try {
    const employees = await db.User.findAll({ where: { role: 'EMPLOYEE' }}, { attributes: ['id', 'firstName', 'lastName'] })
    return res.json(employees)
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const assignToEmployee = async (req, res) => {
  try {
    const { employeeId, matchId } = req.body
    await db.UserMatch.update({ employeeId: employeeId === 'Please select an employee' ? null : employeeId }, { where: { id: matchId }})
    return res.json(await db.User.findAll({ where: { role: 'EMPLOYEE' }}, { attributes: ['id', 'firstName', 'lastName'] }))
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const acceptMatch = async (req, res) => {
  try {
    const match = await db.UserMatch.findByPk(req.params.matchId)
    const realUser = await db.User.findByPk(match.user1Id)
    const fakeUser = await db.User.findByPk(match.user2Id)
    match.user2Response = true
    match.accepted = true
    let mobileNotifications = []
    if (realUser.mobileToken) {
      mobileNotifications.push({
        to: realUser.mobileToken, sound: "default", title: 'You got a new Match!', body: 'Click me to see who liked you.',
        data: { type: 'NEW_MATCH', data: {
            matchedUser: fakeUser
          } }
      })
    }
    const socket = require("../sockets/socketio");
    await socket.sendNotificationsToUsers(mobileNotifications)
    await match.save()

    return res.json('UPDATED')
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const declineMatch = async (req, res) => {
  try {
    await db.UserMatch.update({ user2Response: false }, { where: { id: req.params.matchId }})
    return res.json('UPDATED')
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const generateTokenForEmployee = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.employeeId)
    return res.json(db.User.generateJwtToken(user))
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const serveCustomTemplates = async (req, res) => {
  try {
    const events = await db.Event.findAll({ where: { eventName: 'CUSTOM' } })
    return res.status(200).json(events.map(e => e.templateName))
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const refreshHtmlFiles = async (req, res) => {
  try {
    const events = await db.Event.findAll({
      attributes: [
        [db.Sequelize.fn('DISTINCT', db.Sequelize.col('templateName')) ,'templateName'],
      ]
    })
    const folder = path.join(__dirname, "/../public/emailTemplates/")

    if (!events || events.length === 0) {
      return res.status(400).json('NO TEMPLATES AVAILABLE')
    }

    fs.readdir(folder, (err, files) => {
      if (err) {
        console.log(err)
        return;
      };

      for (const file of files) {
        fs.unlink(path.join(folder, file), err => {
          if (err) throw err;
        });
      }
    });
    events.forEach(async e => {
      s3.getObject({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: 'emailTemplates/' + e.templateName }, async function(err, data) {
        if (err) {
          console.log('ERROR IN LOADING FILE: ')
          // return res.status(400).json('MISSING FILE')
        }
        const fileName = e.templateName
        await writeFile(folder + fileName, data.Body);
      });
    })
    return res.status(200).json()
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const serveCityOptions = async (req, res) => {
  try {
    const cities = await db.User.findAll({
      attributes: [
        [db.Sequelize.fn('DISTINCT', db.Sequelize.col('city')) ,'city'],
      ]
    })
    return res.status(200).json(cities.map(e => e.city))
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const resetUserMatches = async (req, res) => {
  try {
    await db.UserMatch.sync({force: true})
    await db.Messages.sync({force: true})
    await db.Conversation.sync({force: true})
    return res.status(200).json("DELETED")
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const changeVenueImage = async (req, res) => {
  try {
    const venue = await db.Venue.findOne({ where: { id: req.params.id } })
    if (!venue) return res.status(400).json({ backendI18nError: 'USER_NOT_FOUND'});
    const imagePath = path.join(__dirname, "/../public/images");
    const savedFile = await new Resize(imagePath).save(req.file.buffer)
    if (!savedFile) return res.status(400).json({ backendI18nError: 'ERROR_SAVING_IMAGE}' })
    const response = await FileService.uploadFileToAWS(savedFile)
    fs.unlinkSync(imagePath + '/' + savedFile)
    await FileService.deleteFileFromAWS(venue.img)
    venue.img = savedFile
    await venue.save()
    return res.status(200).json("SUCCESS")
  } catch (error) {
    console.log(error)
    return 'INTERNAL_SERVER_ERROR'
  }
};

const changeUserImage = async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { id: req.params.id } })
    if (!user) return res.status(400).json({ backendI18nError: 'USER_NOT_FOUND'});
    const imagePath = path.join(__dirname, "/../public/images");
    const savedFile = await new Resize(imagePath).save(req.file.buffer)
    if (!savedFile) return res.status(400).json({ backendI18nError: 'ERROR_SAVING_IMAGE}' })
    const response = await FileService.uploadFileToAWS(savedFile)
    fs.unlinkSync(imagePath + '/' + savedFile)
    await FileService.deleteFileFromAWS(user.avatar)
    user.avatar = savedFile
    await user.save()
    return res.status(200).json("SUCCESS")
  } catch (error) {
    console.log(error)
    return 'INTERNAL_SERVER_ERROR'
  }
};

const createNewGooglePlace = async (req, res) => {
  try {
    const { name, lat, long, country, city, vicinity } = req.body
    const imagePath = path.join(__dirname, "/../public/images");
    const savedFile = await new Resize(imagePath).save(req.file.buffer)
    if (!savedFile) return res.status(400).json({ backendI18nError: 'ERROR_SAVING_IMAGE}' })
    const response = await FileService.uploadFileToAWS(savedFile)
    fs.unlinkSync(imagePath + '/' + savedFile)
    await db.GooglePlaces.create({
      location: { type: 'Point', coordinates: [lat,long]},
      name: name,
      city: city,
      img: savedFile,
      country: country,
      vicinity: vicinity
    })
    return res.status(200).json("SUCCESS")
  } catch (error) {
    console.log(error)
    return 'INTERNAL_SERVER_ERROR'
  }
};

const getVenueStatistics = async (req, res) => {
  try {
    let statistics = await db.sequelize.query(`select count(id) from "VenueUserHistories" where "VenueId" = :venueId and "joinedAt"  > current_timestamp - interval '30 day'`, {
      replacements: { venueId: req.params.venueId }
    })
    let statistics2 = await db.sequelize.query(`select count(id) from "VenueUserHistories" where "VenueId" = :venueId`, {
      replacements: { venueId: req.params.venueId }
    })
    return res.status(200).json({ monthly: statistics[0][0].count, total: statistics2[0][0].count })
  } catch (error) {
    console.log(error)
    return 'INTERNAL_SERVER_ERROR'
  }
};

const makeVenuesFeatured = async (req, res) => {
  try {
    await db.Venue.update({ featured: true }, { where: { id: req.body.ids }})
    return res.status(200).json('SUCCESS')
  } catch (error) {
    console.log(error)
    return 'INTERNAL_SERVER_ERROR'
  }
};
module.exports = {
  makeVenuesFeatured,
  getVenueStatistics,
  createGooglePlaces,
  googlePlacesToVenues,
  languageFileProperties,
  newLanguageFile,
  generateFakeUsers,
  serveFakeUserMatches,
  serveEmployees,
  assignToEmployee,
  acceptMatch,
  declineMatch,
  generateTokenForEmployee,
  serveCityOptions,
  resetUserMatches,
  changeVenueImage,
  createNewGooglePlace,
  serveCustomTemplates,
  refreshHtmlFiles,
  changeUserImage
}