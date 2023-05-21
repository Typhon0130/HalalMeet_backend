const SmSService = require('./SmsService')
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const fetch = require("node-fetch");
const util = require("util");
const writeFile = util.promisify(fs.writeFile);
const db = require('../models')
const Resize = require("../_helpers/resize");
const path = require("path");
const FileService = require('../services/FileService')
const { sendNotificationsToUsers } = require('../sockets/socketio')
const notificationService = require("./NotificationService");
const {sendMessageToUser} = require("../sockets/socketio");
const { Expo } = require("expo-server-sdk");

const initAuthenticationProcess = async (req, res) => {
  try {
    const { phoneNumber, email, firstName, lastName } = req.body
    const smsToken = generateVerificationToken()
    let user = await db.User.findOne({ where: { phoneNumber: phoneNumber } })
    if (user && user.state === 'BANNED') return res.status(200).json('USER_BANNED')
    if (user && ['VERIFIED', 'ON_BOARDED', 'PAUSED'].includes(user.state)) user.smsToken = smsToken
    if (user && user.state === 'INITIATED') {
      user.smsToken = smsToken
      if (email) user.email = email
      if (firstName) user.firstName = firstName
      if (lastName) user.lastName = lastName
    }
    if (!user) {
      user = await db.User.create({
        phoneNumber: phoneNumber,
        smsToken: smsToken,
        email: email,
        firstName: firstName,
        lastName: lastName,
        images: [null, null, null, null, null],
        verificationStatus: 'VERIFIED' //delete this when SelfieVerification is reimplemented
      })
    }
    const smsSent = await SmSService.sendSms(phoneNumber, "Your code for Halal-Meet is " + user.smsToken)
    if (!smsSent) return res.status(400).json({ backendI18nError: 'FAILED_SENDING_SMS'})
    const siteSetting = await db.SiteSettings.findLatestEnabledOrDefault()
    user.smsTokenExpiresAt = new Date().setMinutes(new Date().getMinutes() + siteSetting.smsTokenExpirationInMinutes);
    await user.save()
    return res.status(200).json(smsToken)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const verifyAuthenticationProcess = async (req, res) => {
  try {
    const { phoneNumber, smsToken, country } = req.body
    const existingUser = await db.User.findOne({ where: { phoneNumber: phoneNumber } })
    if (!existingUser || (existingUser && existingUser.state !== 'ON_BOARDED' && existingUser.smsToken == null)) return res.status(400).json({ backendI18nError: 'AUTH_PROCESS_NOT_INITIATED'})
    if (existingUser.smsToken !== smsToken) return res.status(200).json({ backendI18nError: 'SMS_TOKEN_MISS_MATCH'})
    if (existingUser.smsTokenExpiresAt < new Date()) return res.status(400).json({ backendI18nError: 'SMS_TOKEN_EXPIRED'})
    if (existingUser.state === 'INITIATED') existingUser.state = 'VERIFIED'
    existingUser.smsToken = null
    if (country) {
      const serviceArea = await db.ServiceArea.findEnabled(country.toLowerCase())
      if (!serviceArea) return res.status(400).json({ backendI18nError: 'SERVICE_AREA_NOT_FOUND'});
      existingUser.serviceArea = serviceArea.id
    }
    if (existingUser.state === 'PAUSED') {
      existingUser.state = 'ON_BOARDED'
      if (existingUser.mobileToken) {
        await sendNotificationsToUsers([{
          to: existingUser.mobileToken,
          sound: "default",
          title: 'Welcome back to Halal Meet',
          body: 'Enjoy your stay.',
          data: { type: 'WELCOME_BACK' }
        }])
      }
    }
    await existingUser.save()
    return res.json(db.User.generateJwtToken(existingUser))
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const verifySelfie = async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { id: res.locals.user.id } })
    if (!user) return res.status(400).json({ backendI18nError: 'USER_NOT_FOUND'});
    const imagePath = path.join(__dirname, "/../public/images");
    const savedFile = await new Resize(imagePath).save(req.file.buffer)
    if (!savedFile) return res.status(400).json({ backendI18nError: 'ERROR_SAVING_IMAGE}' })
    await FileService.uploadFileToAWS(savedFile)
    user.selfie.push(savedFile)
    user.selfie = user.selfie.reverse()
    await user.update({ selfie: user.selfie },{ where: { id: user.id } })
    if (user.verificationStatus !== 'REJECTED') {
      user.verificationStatus = 'WAITING_FOR_VERIFICATION'
    }
    await user.save();
    fs.unlinkSync(imagePath + '/' + savedFile)
    notificationService.sendEmailWithTemplateToUser('REGISTRATION', user)
    return res.json(db.User.generateJwtToken(user))
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const onBoardUser = async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { id: res.locals.user.id } })
    req.body.countries = req.body.countries.split(',').map(e => { return { name: e } })
    req.body.languages = req.body.languages.split(',')
    req.body.interests = JSON.parse(req.body.interests)
    const error = await db.User.saveProfile(req, user, db)
    if (error) return res.status(400).json({ backendI18nError: 'ERROR_SAVING_PROFILE'})
    user.state = 'ON_BOARDED'
    let siteSetting = await db.SiteSettings.findLatestEnabledOrDefault()
    if (siteSetting) {
      user.swipesLeft = Number(siteSetting.swipeLimit)
    } else {
      user.swipesLeft = 33
    }
    let savedAvatar
    const imagePath = path.join(__dirname, "/../public/images");
    let isAuthImg = req.body.authImg && req.body.authImg !== 'undefined' && req.body.authImg !== 'null'
    if (isAuthImg) {
      const response = await fetch(req.body.authImg);
      const buffer = await response.buffer();
      const folder = path.join(__dirname, "/../public/images/")
      const fileName = uuidv4() + '.jpg'
      await writeFile(folder + fileName, buffer);
      await FileService.uploadFileToAWS(fileName)
      await fs.unlinkSync(folder + '/' + fileName)
      savedAvatar = fileName
    } else {
      savedAvatar = await new Resize(imagePath).save(req.files[0].buffer)
      if (!savedAvatar) return res.status(400).json({ backendI18nError: 'ERROR_SAVING_IMAGE}' })
      await FileService.uploadFileToAWS(savedAvatar)
    }
    if(req.files && req.files.length > 0) {
      for (let i = isAuthImg ? 0: 1; i < req.files.length; i++) {
        let file = await new Resize(imagePath).save(req.files[i].buffer)
        if (!file) return res.status(400).json({ backendI18nError: 'ERROR_SAVING_IMAGE}' })
        await FileService.uploadFileToAWS(file)
        user.images[i] = file
      }
    }
    user.avatar = savedAvatar
    user.images = JSON.parse(JSON.stringify(user.images))
    await user.save();
    return res.json({ ...db.User.generateJwtToken(user), verificationStatus: user.verificationStatus})
  } catch(error) {
    console.log(error)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const verifyLocation = async (req, res) => {
  try {
    const { city, country, iso, region, lat, long, lang } = req.body
    const serviceArea = await db.ServiceArea.findEnabled(iso)
    if (!serviceArea) return res.status(200).json({ backendI18nError: 'SERVICE_AREA_NOT_FOUND'});
    if (res.locals.user) {
      const user = await db.User.findOne({ where: { id: res.locals.user.id } })
      if (!user) return res.status(400).json({ backendI18nError: 'USER_NOT_FOUND'});
      if (!user.freezeLocation) {
        user.swipeCity = city
        user.swipeRegion = region
        user.swipeCountry = country
        user.swipeIso = iso
      }
      user.serviceArea = serviceArea.id
      user.country = country
      user.iso = iso
      user.lat = lat
      user.long = long
      user.location =  { type: 'Point', coordinates: [lat, long]}
      user.region = region
      user.city = city

      // CHECK FOR AUTO LOG OUT OF VENUE
      if (user.VenueId) {
        let userVenue = await db.sequelize.query(`SELECT venue.id, venue.name FROM "Venues" AS "venue"
         WHERE ST_DWithin("location", ST_MakePoint(:lat, :long), :maxDistance, false) = true and "venue".id = :venueId`,
          {
            replacements: { lat, long, maxDistance: 500, venueId: user.VenueId },
            type: db.sequelize.QueryTypes.SELECT, model: db.Venue
          })
        if (!userVenue || (userVenue && userVenue.length === 0)) {
          await db.VenueUserHistory.update({ leftAt: new Date() }, { where: {
              UserId: user.id,
              VenueId: user.VenueId,
              leftAt: { [db.Sequelize.Op.eq]: null }
            }})
          let venue = await db.Venue.findOne({ where: { id: user.VenueId }})
          user.VenueId = null
          await sendNotificationsToUsers([{
            to: user.mobileToken,
            sound: "default",
            android: {
              channelId: 'VENUE'
            },
            title: 'You went too far from ' + venue.name,
            body: 'You left the venue automatically.',
            data: { type: 'LEFT_VENUE', data: { venueName: venue.name } }
          }])
          let otherUsers = await db.sequelize.query(`SELECT vuh."UserId" as userId, u."mobileToken", v.name, v.id as venueid FROM "VenueUserHistories" AS "vuh"
                                                     left join "Users" u on vuh."UserId" = u.id
                                                     left join "Venues" v on vuh."VenueId" = v.id
                                                     where vuh."joinedAt" < now() and vuh."leftAt" is null and vuh."UserId" != ${user.id}`)
          if (otherUsers && otherUsers.length > 0) {
            otherUsers[0].forEach(u => {
              sendMessageToUser(u.userid, 'someone-left-venue', res.locals.user.id)
            })
          }
        }
      }

      await user.save()
      if (user.state === 'BANNED') {
        return res.json('BANNED')
      }
      return res.json(db.User.generateJwtToken(user))
    }
    return res.status(200).json("ENABLED")
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const generateVerificationToken = () => { return Math.floor(100000 + Math.random() * 900000) } // GENERATE RANDOM 6 DIGIT NUMBER

const createNewNotifications = async (req, res) => {
  try {
    console.log("DELIVERING USER NOTIFICATIONS...", req.body)
    const { type, serviceArea, gender, city, message, subject, template } = req.body
    console.log(req.body)
    const users = await db.User.findAll({ where: { iso: serviceArea, gender: gender, ...(city ? { city: city } : {}) }})
    console.log(users.length)
    let mobileNotifications = [];
    for (const user of users) {
      if (type === 'EMAIL') {
        await notificationService.sendEmailWithTemplateToUser('CUSTOM', user, template)
      } else if (type === 'MOBILE_OS' && user.mobileToken) {
        console.log('DELIVERING NOTIFICATION TO: ' + user.firstName + user.lastName)
        if (!Expo.isExpoPushToken(user.mobileToken)) {
          console.error(`Push token ${user.mobileToken} is not a valid Expo push token`);
          continue;
        }
        if (user.notificationsReceived < 4) {
          mobileNotifications.push({
            to: user.mobileToken,
            sound: "default",
            title: subject,
            body: message,
            data: { type: 'ADMIN_MSG', data: { message: subject + '  ' + message } }
          });
        }
      } else if (type === 'SMS') {
        await SmSService.sendSms(user.phoneNumber, message)
      }
    }
    await sendNotificationsToUsers(mobileNotifications)
    console.log('NOTIFICATIONS DELIVERED TO: ' + users.length)
    return res.json("NOTIFICATIONS_DELIVERED")
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const validateOauthEmail = async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { email: req.params.email }})
    if (!user) { return res.json("NEW_USER")}
    const token = await db.User.generateJwtToken(user)
    return res.json({ token: token.token, user: { state: user.state, verificationStatus: user.verificationStatus }})
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const checkEmailUnique = async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { email: req.params.email }})
    if (!user) { return res.json("AVAILABLE")}
    return res.json("TAKEN")
  } catch (error) {
    console.log(error);
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

const initAuthenticationProcessApple = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body
    let user = await db.User.findOne({ where: { email: email } })
    if (user && user.state === 'BANNED') return res.status(200).json('USER_BANNED')
    if (user && ['VERIFIED', 'ON_BOARDED', 'PAUSED'].includes(user.state)) user.smsToken = 111111;
    if (user && user.state === 'INITIATED') {
      user.smsToken = smsToken
      if (email) user.email = email
      if (firstName) user.firstName = firstName
      if (lastName) user.lastName = lastName
    }
    if (!user) {
      user = await db.User.create({
        phoneNumber: null,
        smsToken: 111111,
        email: email,
        firstName: firstName,
        lastName: lastName,
        images: [null, null, null, null, null],
        verificationStatus:'WAITING_FOR_VERIFICATION',
      })
    }
    const siteSetting = await db.SiteSettings.findLatestEnabledOrDefault()
    user.smsTokenExpiresAt = new Date().setMinutes(new Date().getMinutes() + siteSetting.smsTokenExpirationInMinutes);
    await user.save()
    // return res.status(200).json(smsToken)

    // verification
    const { phoneNumber, smsToken, country } = req.body
    const existingUser = user;

    if (existingUser.state === 'INITIATED') existingUser.state = 'VERIFIED'
    existingUser.smsToken = null
    if (country) {
      const serviceArea = await db.ServiceArea.findEnabled(country.toLowerCase())
      if (!serviceArea) return res.status(400).json({ backendI18nError: 'SERVICE_AREA_NOT_FOUND'});
      existingUser.serviceArea = serviceArea.id
    }
    if (existingUser.state === 'PAUSED') {
      existingUser.state = 'ON_BOARDED'
      if (existingUser.mobileToken) {
        await sendNotificationsToUsers([{
          to: existingUser.mobileToken,
          sound: "default",
          title: 'Welcome back to Halal Meet',
          body: 'Enjoy your stay.',
          data: { type: 'WELCOME_BACK' }
        }])
      }
    }
    await existingUser.save()
    return res.json(db.User.generateJwtToken(existingUser))

  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}



module.exports = {
  onBoardUser,
  checkEmailUnique,
  initAuthenticationProcess,
  verifyAuthenticationProcess,
  verifyLocation,
  sendMessageToUser,
  createNewNotifications,
  verifySelfie,
  validateOauthEmail,
  initAuthenticationProcessApple
}
