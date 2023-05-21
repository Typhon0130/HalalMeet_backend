const Resize = require("../_helpers/resize");
const path = require("path");
const fs = require("fs");
const FileService = require('../services/FileService')
const rawSqlService = require('./rawSqlService')
const db = require('../models/index')
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { Model, Op } = require('sequelize');
const Places = require("google-places-web").default;
const axios = require('axios')
const notificationService = require("./NotificationService");
const {sendMessageToUser} = require("../sockets/socketio");
const {isUserOnline} = require("../sockets/socketio");

Places.apiKey = process.env.GOOGLE_DEV_KEY
Places.debug = true

const editLoggedInUser = async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { id: res.locals.user.id } })
    if (!user) return res.status(400).json({ backendI18nError: 'USER_NOT_FOUND'});
    const error = await db.User.saveProfile(req, user, db)
    if (error) return res.status(400).json({ backendI18nError: 'ERROR_SAVING_PROFILE' })
    await user.save()
    return res.json("SUCCESSFUL_PROFILE_EDIT");
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const serveLoggedInUserProfile = async (req, res) => {
  try {
    let user = await db.User.findByPk(res.locals.user.id, { include: [
        { model: db.UserCountry, attributes: ['name'] },
        { model: db.UserLanguage, attributes: ['name'] },
        { model: db.UserBadge, attributes: ['badge'] },
        { model: db.UserInterest, attributes: ['i18nName', 'icon'] }
      ] })
    if (!user) return res.status(400).json();
    user = user.toJSON()
    user.UserLanguages = user.UserLanguages.map(lang => { return lang.name })
    user.UserBadges = user.UserBadges.map(badge => { return badge.badge })
    if (!user.height) { user.height = '' }
    if (!user.occupation) { user.occupation = '' }
    if (!user.highlights) { user.highlights = '' }
    return res.json(user)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const serveUserPublicProfile = async (req, res) => {
  try {
    let user = await db.User.findByPk(req.params.id, { include: [
        { model: db.UserCountry, attributes: ['name'] },
        { model: db.UserBadge, attributes: ['badge'] },
        { model: db.UserLanguage, attributes: ['name'] },
        { model: db.UserInterest, attributes: ['i18nName', 'icon'] }
      ] })
    if (!user) return res.status(400).json({ backendI18nError: 'USER_NOT_FOUND'});
    user = user.toJSON()
    if (res.locals.user && res.locals.user.id) {
      let userMatch = await db.UserMatch.findOne({ where: { user1Id: req.params.id, user2Id: res.locals.user.id }})
      if (!userMatch) userMatch = await db.UserMatch.findOne({ where: { user2Id: req.params.id, user1Id: res.locals.user.id }})
      if (userMatch) {
        user.matchStatus = await db.UserMatch.calculateMatchStatus(userMatch, res.locals.user.id)
        if ((userMatch.type === 'DIRECT_MESSAGE' && userMatch.user1Id === res.locals.user.id && userMatch.accepted === false)) {
          user.dirMsgReq = true
        } else {
          user.dirMsgReq = false
        }
      } else {
        user.matchStatus = 'UNKNOWN'
      }
    }
    user.UserLanguages = user.UserLanguages.map(lang => { return lang.name }).filter(e => e !== 'null')
    user.UserBadges = user.UserBadges.map(badge => { return badge.badge })
    user.images = user.images.filter(e => e !== null)
    if (!user.height) { user.height = '' }
    if (!user.occupation) { user.occupation = '' }
    return res.json(user)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const deleteLoggedInUser = async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { id: res.locals.user.id }, raw: true })
    if (!user) return res.status(400).json({ backendI18nError: 'USER_NOT_FOUND'});
    await db.DeletionReason.create({
      userId: res.locals.user.id,
      ...user,
      id: undefined,
      reason: req.body.reason
    })
    await removeUserData(res.locals.user.id)
    notificationService.sendEmailWithTemplateToUser('DELETION', user)
    return res.json("SUCCESSFUL_USER_DELETE")
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const add3DMToUser = async (userId) => {
  let user = await db.User.findByPk(userId)
  user.nrOfDirectMessages += 3
  user.save()
}

const verifySelfie = async (userId) => {
  let user = await db.User.findByPk(userId)
  user.verificationStatus = 'VERIFIED'
  await user.save()
  sendMessageToUser(user.id, 'refresh-user-data', {})
}

const rejectSelfie = async (userId) => {
  console.log('REJECTING SELFIE')
  let user = await db.User.findByPk(userId)
  user.verificationStatus = 'REJECTED'
  await user.save()
  sendMessageToUser(user.id, 'refresh-user-data', {})
}

const removeUserData = async (userId) => {
  if (userId) {
    await db.UserBlock.destroy({ where: { blockedUserId: userId }})
    await db.UserBlock.destroy({ where: { userId: userId }})
    await db.UserLanguage.destroy({ where: { UserId: userId }})
    await db.UserCountry.destroy({ where: { UserId: userId }})
    await db.UserInterest.destroy({ where: { UserId: userId }})
    await db.UserMatch.destroy({ where: { user1Id: userId }})
    await db.UserMatch.destroy({ where: { user2Id: userId }})
    await db.VenueUserHistory.destroy({ where: { UserId: userId }})
    await db.UserBadge.destroy({ where: { userId: userId }})
    await db.UserReport.destroy({ where: { user1Id: userId }})
    await db.UserReport.destroy({ where: { user2Id: userId }})
    await db.User.destroy({ where: { id: userId }})
    await db.Payment.destroy({ where: { userId: userId }})
  }
}

const pauseLoggedInUser = async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { id: res.locals.user.id } })
    if (!user) return res.status(400).json({ backendI18nError: 'USER_NOT_FOUND'});
    user.state = 'PAUSED'
    await user.save()
    notificationService.sendEmailWithTemplateToUser('PAUSE', user)
    return res.json("USER_PAUSED")
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const buyPremium = async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { id: res.locals.user.id } })
    if (!user) return res.status(400).json({ backendI18nError: 'USER_NOT_FOUND'});
    if (user.role === 'PREMIUM_USER') return res.status(400).json({ backendI18nError: 'PREMIUM_ALREADY'});
    const plan = await db.SubscriberPlan.findOne({ where: { productId: req.params.subscriberPlanId }})
    if (!plan) return res.status(400).json({ backendI18nError: 'PLAN_NOT_FOUND'});
    var d = new Date();
    d.setMonth(d.getMonth() + plan.lengthInMonths);
    if (plan.lengthInMonths === 3) {
      user.premiumUntil = moment(new Date()).add(5, 'minutes').toDate()
    } else {
      user.premiumUntil = d
    }
    await db.Payment.create({
      userId: res.locals.user.id,
      productType: req.params.subscriberPlanId,
      price: req.body.price
    })
    user.role = 'PREMIUM_USER'
    await user.save()
    return res.json(db.User.generateJwtToken(user))
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const buyDirectMessage = async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { id: res.locals.user.id } })
    if (!user) return res.status(400).json({ backendI18nError: 'USER_NOT_FOUND'});
    const plan = await db.DirectMessagePlan.findOne({ where: { productId: req.params.productId }})
    if (!plan) return res.status(400).json({ backendI18nError: 'PLAN_NOT_FOUND'});
    await db.Payment.create({
      userId: res.locals.user.id,
      productType: req.params.productId,
      price: req.body.price,
      orderID: req.body.orderId,
    })
    user.nrOfDirectMessages = user.nrOfDirectMessages + plan.quantity
    await user.save()
    return res.json(db.User.generateJwtToken(user))
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const changeLocation = async (req, res) => {
  try {
    const { city, region, country, iso } = req.body
    const user = await db.User.findOne({ where: { id: res.locals.user.id } })
    if (!user) return res.status(400).json({ backendI18nError: 'USER_NOT_FOUND'});
    user.swipeCity = city
    user.swipeRegion = region
    user.swipeCountry = country
    user.swipeIso = iso
    user.freezeLocation = true
    await user.save()
    return res.json(db.User.generateJwtToken(user))
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const enableLocationUpdates = async (req,res) => {
  try {
    const user = await db.User.findByPk(res.locals.user.id)
    user.freezeLocation = false
    user.swipeCity = user.city
    user.swipeCountry = user.country
    user.swipeRegion = user.region
    user.swipeIso = user.iso
    await user.save()
    return res.json("ENABLED")
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const searchCityByServiceArea = async (req,res) => {
  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/autocomplete/json", { params: {
        input: req.body.city,
        types: '(cities)',
        components: "country:" + req.body.country,
        key: process.env.GOOGLE_DEV_KEY
      } });
    const asd = response.data.predictions.map(e => e.structured_formatting.main_text)
    return res.json(asd)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const uploadImage = async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { id: res.locals.user.id } })
    if (!user) return res.status(400).json({ backendI18nError: 'USER_NOT_FOUND'});
    const imagePath = path.join(__dirname, "/../public/images");
    const savedFile = await new Resize(imagePath).save(req.file.buffer)
    if (!savedFile) return res.status(400).json({ backendI18nError: 'ERROR_SAVING_IMAGE}' })
    await FileService.uploadFileToAWS(savedFile)
    fs.unlinkSync(imagePath + '/' + savedFile)
    if (req.params.imageType === 'images') {
      if (!user.images) user.images = [null, null, null, null, null];
      else user.images = user.images.filter(img=>img);
      console.log('Images after removing null ###---------->',user.images);
      user.images.push(savedFile);
      if (user.images.length < 5) {
        for (let i = user.images.length; i < 5; i++) {
          user.images.push(null)
        }
      }
      //let index = Number(req.params.index)
      //user.images[index] = savedFile
      user.images = JSON.parse(JSON.stringify(user.images))
      await user.save()
    } else if (req.params.imageType === 'avatar') {
      await FileService.deleteFileFromAWS(user.avatar)
      user.avatar = savedFile
      await user.save()
    }
  } catch (error) {
    console.log(error)
    return 'INTERNAL_SERVER_ERROR'
  }
};

const deleteImage = async (req, res) => {
  try {
    const user = await db.User.findOne({ where: { id: res.locals.user.id } })
    if (!user) return res.status(400).json({ backendI18nError: 'USER_NOT_FOUND'});
    if (!user.images || user.images.length === 0) return res.status(400).json({ backendI18nError: 'IMAGE_NOT_FOUND'});
    req.params.index = Number(req.params.index)
    if (user.images[req.params.index]) {
      await FileService.deleteFileFromAWS(user.images[req.params.index])
    }
    user.images[req.params.index] = null;
    user.images = user.images.filter(img=>img);
    console.log('In Delete: Images after removing null ###---------->',user.images);
    if (user.images.length < 5) {
      for (let i = user.images.length; i < 5; i++) {
        user.images.push(null)
      }
    }
    user.images = JSON.parse(JSON.stringify(user.images))
    await user.save()
    return res.status(200).json("IMAGE_DELETED")
  } catch (error) {
    console.log(error)
    return 'INTERNAL_SERVER_ERROR'
  }
};

const serveLoggedInUserMatches = async (req, res) => {
  try {
    let query
    if (req.params.matchType === 'liked') query = rawSqlService.serveLoggedInUserLiked
    else if (req.params.matchType === 'liked-me') query = rawSqlService.serveLoggedInUserLikedMe
    else if (req.params.matchType === 'passed') query = rawSqlService.serveLoggedInUserPassed
    let users = await db.sequelize.query(query, {
      replacements: {
        userId: res.locals.user.id,
        limit: req.query.limit ? req.query.limit : 10,
        skip: req.query.offset ? req.query.offset : 0
      },
      model: db.User,
      mapToModel: true,
      type: db.Sequelize.QueryTypes.SELECT
    });
    return res.json(users)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const serveServiceAreas = async (req, res) => {
  try {
    return res.json(await db.ServiceArea.findAll({}).map(e => { return { label: e.label, iso: e.iso } }))
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const serveWaves = async (req, res) => {
  try {
    const waves = await db.sequelize.query(`
                SELECT um."user1Id" as userId, 
                       um."user1Id", 
                       um."user2Id", 
                       um."user1Response", 
                       um.accepted, 
                       um."seen", 
                       um."user2Response", 
                       um."createdAt" as wavedAtDate, 
                       u."firstName" as user1FirstName, 
                       u2."firstName" as user2FirstName, 
                       u."avatar" as user1Avatar, 
                       u2."avatar" as user2Avatar, 
                       u."bornAt", 
                       string_agg(uc.name,',') as coununtries, 
                       v.name as venuename, 
                       v.id as venueId
                FROM "UserMatches" um
                         LEFT JOIN "Users" u on u.id = um."user1Id"
                         LEFT JOIN "Users" u2 on u2.id = um."user2Id"
                         LEFT JOIN "UserCountries" uc on uc."UserId" = u.id
                         LEFT JOIN "Venues" v on v.id = um."venueId"
                WHERE (um."user2Id" = :userId or 
                       (um."user1Id" = :userId and "user1Response" = true and um."user2Response" = true and um.accepted = true)
                    )
                  and um.type = 'WAVE'
                GROUP BY um."createdAt", um.id, u."firstName", u."lastName", u2.avatar, u."bornAt", v.name, v.id, u2."firstName", u."avatar"
                ORDER BY um."createdAt" DESC
                LIMIT :limit
                OFFSET :offset;
    `,
      {
        replacements: {
          userId: res.locals.user.id,
          limit: req.query.limit ? req.query.limit : 10,
          offset: req.query.offset ? req.query.offset: 0
        },
        type: db.sequelize.QueryTypes.SELECT
      })
    await db.UserMatch.update({ seen: true }, { where: {  user2Id: res.locals.user.id, type: 'WAVE' } })
    for (const wave of waves) {
      wave.matchStatus = await db.UserMatch.calculateMatchStatus(wave, res.locals.user.id)
    }
    return res.json(waves)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const reportUser = async (req, res) => {
  try {
    const { blockUser, reason, reportedUserId } = req.body
    await db.UserReport.create({
      reason: reason,
      user1Id: res.locals.user.id,
      user2Id: reportedUserId
    })
    if (blockUser) {
      const block = await db.UserBlock.findOne({ where: { userId: res.locals.user.id, blockedUserId: reportedUserId } })
      if (block) return res.status(400).json('USER_ALREADY_BLOCKED')
      await db.UserBlock.create({ userId: res.locals.user.id, blockedUserId: reportedUserId })
    }
    return res.json("REPORTED")
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const unMatchUser = async (req, res) => {
  try {
    let match = await db.UserMatch.findOne({
      where: {
        user1Id: {[Op.or]: [res.locals.user.id, req.params.id]},
        user2Id: {[Op.or]: [res.locals.user.id, req.params.id]}
      }
    })
    if (match) {
      if (match.user1Id === res.locals.user.id) {
        match.user1Response = false
      } else {
        match.user2Response = false
      }
      match.save()
    }
    await db.Message.destroy({ where: {
        sender: { [Op.or]: [res.locals.user.id, req.params.id] },
        receiver: { [Op.or]: [res.locals.user.id, req.params.id] }
      } })
    return res.json("UN_MATCHED")
  } catch (error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const blockUser = async (req, res) => {
  try {
    const block = await db.UserBlock.findOne({ where: { userId: res.locals.user.id, blockedUserId: req.params.id } })
    if (block) return res.status(400).json('USER_ALREADY_BLOCKED')
    await db.UserBlock.create({ userId: res.locals.user.id, blockedUserId: req.params.id })
    await db.Message.destroy({ where: { sender: res.locals.user.id, receiver: req.params.id } })
    await db.Message.destroy({ where: { sender: req.params.id, receiver: res.locals.user.id } })
    sendMessageToUser(req.params.id, 'refresh-user-data')
    return res.json("BLOCKED")
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const serveWaveCount = async (req, res) => {
  try {
    return res.json(await db.UserMatch.count({ where: { seen: false, user2Id: res.locals.user.id, type: 'WAVE' } }))
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const serveMessageCount = async (req, res) => {
  try {
    const dbResult = await db.sequelize.query(`
        select um.id, um."user1Id", um."user2Id" from "UserMatches" um 
        where (
                (um."user1Id" = :userId and um."user1Seen" is false) or 
               (um."user2Id" = :userId and um."user2Seen" is false) and "user1Response" is true and "user2Response" is true
            )
       `,
      {
        replacements: {
          userId: res.locals.user.id,
        },
        type: db.sequelize.QueryTypes.SELECT
      })
    if (dbResult.length > 0) {
      let user1Ids = dbResult.filter(e => e.user1Id === res.locals.user.id).map(e => e.id)
      let user2Ids = dbResult.filter(e => e.user2Id === res.locals.user.id).map(e => e.id)
      if (user1Ids.length > 0) {
        await db.UserMatch.update({ user1Seen: true }, {where: { id: { [Op.or]: user1Ids } }})
      }
      if (user2Ids.length > 0) {
        await db.UserMatch.update({ user2Seen: true }, {where: { id: { [Op.or]: user2Ids } }})
      }
    }

    return res.json(dbResult && dbResult.length > 0 ? dbResult.length : null)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(400).json('INTERNAL_SERVER_ERROR')
  }
}

const revertLike = async (req, res) => {
  try {
    const match = await db.UserMatch.findByPk(req.params.matchId)
    if (!match) return res.status(400).json({ backendI18nError: 'MATCH_NOT_FOUND'});
    const userIsUser1 = match.user1Id === res.locals.user.id
    userIsUser1 ? match.user1Response = false : match.user2Response = false
    await match.save()
    return res.json("REVERTED")
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const revertPass = async (req, res) => {
  try {
    const match = await db.UserMatch.findByPk(req.params.matchId)
    if (!match) return res.status(400).json({ backendI18nError: 'MATCH_NOT_FOUND'});
    const userIsUser1 = match.user1Id === res.locals.user.id
    userIsUser1 ? match.user1Response = true : match.user2Response = true
    await match.save()
    return res.json("REVERTED")
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const updateMobileToken = async (req, res) => {
  try {
    const user = await db.User.findByPk(res.locals.user.id)
    user.mobileToken = req.body.token
    await user.save()
    return res.json("SAVED")
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const serveUserReports = async (req, res) => {
  try {
    let reports = await db.sequelize.query(`select ur.reason, ur."createdAt", ur."user1Id", ur."user2Id", u1."firstName" as u1FirstName, u1."lastName" as u1LastName, u2."firstName" as u2FirstName, u2."lastName" as u2LastName 
                                            from "UserReports" ur
                                           left join "Users" u1 on u1.id = ur."user1Id"
                                           left join "Users" u2 on u2.id = ur."user2Id"
                                           where ur."user2Id" = :userId or ur."user1Id" = :userId`,
      {
        replacements: {
          userId: req.params.id
        },
        type: db.sequelize.QueryTypes.SELECT
      })
    if (!reports) return res.status(400).json({ backendI18nError: 'REPORTS_NOT_FOUND'});
    return res.json(reports)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const checkIfUserIsOnline = (req, res) => {
  try {
    return res.json(isUserOnline(req.params.id))
  } catch(error) {
    console.log(error)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

module.exports = {
  checkIfUserIsOnline,
  serveUserReports,
  editLoggedInUser,
  serveLoggedInUserProfile,
  serveLoggedInUserMatches,
  deleteLoggedInUser,
  uploadImage,
  deleteImage,
  pauseLoggedInUser,
  buyPremium,
  serveUserPublicProfile,
  buyDirectMessage,
  changeLocation,
  enableLocationUpdates,
  serveServiceAreas,
  serveWaves,
  searchCityByServiceArea,
  reportUser,
  blockUser,
  serveWaveCount,
  serveMessageCount,
  revertLike,
  revertPass,
  updateMobileToken,
  unMatchUser,
  removeUserData,
  add3DMToUser,
  rejectSelfie,
  verifySelfie
}
