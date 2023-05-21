const db = require("../models");
const {isUserOnline} = require("../sockets/socketio");
const {sendNotificationsToUsers} = require("../sockets/socketio");
const {sendMessageToUser} = require("../sockets/socketio");
const { Expo } = require("expo-server-sdk");
const { Model, Op } = require('sequelize');

const serveVenues = async (req, res) => {
  try {
    const {lat, long, offset, limit } = req.query

    const maxDistance = 250;
    let venues = await db.sequelize.query(`
          SELECT venue.id, venue.name, venue.img, venue.vicinity, venue.icon, venue.rating, venue."placeId",
            ST_Distance("location", ST_MakePoint(:lat, :long), false) AS "distance", 
           vuh.online as "onlineUserCount"
          FROM "Venues" AS "venue"
              left join (select vuh."VenueId", count("UserId") as online from "VenueUserHistories" vuh
                         left join "Users" u on u.id = vuh."UserId"
                         where date_trunc('day' , "joinedAt") = DATE_TRUNC('DAY', NOW())
                           and "leftAt" is null
                           and u.gender = :gender
                         group by vuh."VenueId")
          vuh on vuh."VenueId" = venue.id
          WHERE ST_DWithin("location", ST_MakePoint(:lat, :long), :maxDistance, false) = true
          ORDER BY distance
          LIMIT :limit
          OFFSET :offset`,
      {
        replacements: {
          lat,
          long,
          limit: 100,
          offset: offset ? offset : 0,
          maxDistance,
          gender: res.locals.user.gender === 'FEMALE' ? 'MALE' : 'FEMALE'
        },
        type: db.sequelize.QueryTypes.SELECT
      })
    venues = venues.map(venue => {
      venue.onlineUserCount = db.Venue.mapOnlineCount(venue.onlineUserCount)
      return venue
    })
    return res.json(venues);
  } catch (e) {
    console.log(e)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const serveFeaturedVenues = async (req, res) => {
  try {
    const { lat, long, offset, limit, city  } = req.query

    let user = await db.User.findOne({ where: { id: res.locals.user.id } })
    const serviceArea = await db.ServiceArea.findOne({ where: { id: user.serviceArea } })
    let venues = await db.sequelize.query(`
          SELECT venue.id, venue.name, venue.img, venue.vicinity, venue.icon, venue.rating,
            ST_Distance("location", ST_MakePoint(:long, :lat), false) AS "distance", 
           vuh.online as "onlineUserCount"
          FROM "Venues" AS "venue"
              left join (select vuh."VenueId", count("UserId") as online from "VenueUserHistories" vuh
                         left join "Users" u on u.id = vuh."UserId"
                         where date_trunc('day' , "joinedAt") = DATE_TRUNC('DAY', NOW())
                           and "leftAt" is null
                           and u.gender = :gender
                         group by vuh."VenueId")
          vuh on vuh."VenueId" = venue.id
          WHERE ST_DWithin(ST_MakePoint(ST_Y(location), ST_X(location))::geography,
                           ST_MakePoint(:long, :lat)::geography, :maxDistance-500, false)
                -- ST_Distance(ST_SetSRID(ST_MakePoint(ST_X("location"), ST_Y("location"))::geography, 4326),ST_SetSRID(ST_MakePoint(:lat, :long), 4326)::geography, true) < :maxDistance
                -- ST_Distance(location, ST_SetSRID(ST_MakePoint(:long, :lat),4326)) * 111.111 - 20 <= 0 
               -- ST_DWithin("location", ST_MakePoint(:lat, :long), :maxDistance, false) = true  
           -- ST_DWithin(ST_Transform("location",4326), ST_SetSRID(ST_MakePoint(:lat, :long),4326), :maxDistance, false) = true
           -- AND 
           -- ST_Distance("location", ST_SetSRID(ST_MakePoint(:lat, :long),4326)) * 10000 - 2000 <= 0
             --ST_DWithin("location", ST_SetSRID(ST_MakePoint(:lat, :long),4326), 4000/10000, false) = true
           AND "venue".featured = true
          ORDER BY distance
          LIMIT :limit
          OFFSET :offset`,
      {
        replacements: {
          lat,
          long,
          limit: limit ? limit : 10,
          offset: offset ? offset : 0,
          maxDistance: serviceArea.featuredVenueDiscoveryDistance,
          city,
          gender: res.locals.user.gender === 'FEMALE' ? 'MALE' : 'FEMALE'
        },
        type: db.sequelize.QueryTypes.SELECT
      })
    if (venues && venues.length > 0) {
      venues = venues.map(venue => {
        venue.onlineUserCount = db.Venue.mapOnlineCount(venue.onlineUserCount)
        return venue
      })
    }
    return res.json(venues);
  } catch (e) {
    console.log(e)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const joinVenue = async (req, res) => {
  try {
    const venue = await db.Venue.findByPk(req.params.id)
    const { confirmed } = req.query
    if (!venue) return res.status(400).json({backendI18nError: 'VENUE_NOT_FOUND'})
    const user = await db.User.findByPk(res.locals.user.id)
    if (venue.id === user.VenueId) { // REJOINING JOINED VENUE
      return res.json("ALREADY_JOINED_VENUE");
    } else if (user.VenueId && venue.id !== user.VenueId) { // LEAVING PREVIOUS VENUE
      const userVenue = await db.Venue.findByPk(user.VenueId)
      if (!confirmed) return res.json({ message: "CONFIRM_JOIN", venueName: userVenue.name })
      let usersToNotify = await db.User.findAll({ where: { VenueId: user.VenueId, gender: user.gender === 'MALE' ? 'FEMALE' : 'MALE' }})
      usersToNotify.forEach(e => {
        let online = isUserOnline(e.id)
        if (online) {
          sendMessageToUser(e.id, 'someone-left-venue', e.id)
        }
      })
      user.VenueId = null
      console.log('VenueId: '+req.params.id+'  UserId: '+res.locals.user.id);
      const venueHistory = await db.VenueUserHistory.findOne({ where: { UserId: res.locals.user.id, leftAt: null }});
      venueHistory.leftAt = new Date();
      await venueHistory.save();
      await user.save()
    }
    await db.VenueUserHistory.create({
      UserId: res.locals.user.id,
      VenueId: venue.id,
      joinedAt: new Date(),
      leftAt: null
    })
    let usersToNotify = await db.User.findAll({ where: { VenueId: venue.id, gender: user.gender === 'MALE' ? 'FEMALE' : 'MALE' }})
    let mobileNotifications = [];
    for (const userToNotify of usersToNotify) {
      if (isUserOnline(userToNotify.id)) {
        let countries = await db.UserCountry.findAll({ where: { UserId: res.locals.user.id } })
        let match = await db.UserMatch.findOne({
          where: {
            user1Id: {[Op.or]: [res.locals.user.id, userToNotify.id]},
            user2Id: {[Op.or]: [res.locals.user.id, userToNotify.id]}
          }
        })
        let matchStatus = 'UNKNOWN'
        if (match) {
          matchStatus = await db.UserMatch.calculateMatchStatus(match, userToNotify.id)
        }
        sendMessageToUser(userToNotify.id, 'someone-joined-venue', { countries: countries.map(e => e.name).join(','), matchStatus, firstName: user.firstName, id: user.id, avatar: user.avatar, bornAt: user.bornAt })
      } else {
        if (userToNotify.id !== res.locals.user.id) {
          console.log('DELIVERING NOTIFICATION TO: ' + userToNotify.firstName)
          if (!Expo.isExpoPushToken(userToNotify.mobileToken)) {
            console.error(`Push token ${userToNotify.mobileToken} is not a valid Expo push token`);
            continue;
          }
          mobileNotifications.push({
            to: userToNotify.mobileToken,
            sound: "default",
            title: user.firstName + ' just joined ' + venue.name,
            android: {
              channelId: 'VENUE'
            },
            body: 'Go and see for yourself!',
            data: { type: 'JOINED_VENUE', data: { message: user.firstName + ' just joined ' + venue.name, venueId: venue.id, venueName: venue.name } }
          });
        }
      }
    }
    if (mobileNotifications.length > 0 ) {
      await sendNotificationsToUsers(mobileNotifications)
    }
    user.VenueId = venue.id
    await user.save()
    await venue.save()
    return res.json(db.User.generateJwtToken(user))
  } catch (e) {
    console.log(e)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const leaveVenue = async (req, res) => {
  try {
    const user = await db.User.findByPk(res.locals.user.id)
    await db.VenueUserHistory.update({ leftAt : new Date() }, { where: {
        UserId: res.locals.user.id,
        VenueId: user.VenueId,
        leftAt: { [db.Sequelize.Op.eq]: null }
      }})
    let usersToNotify = await db.User.findAll({ where: { VenueId: user.VenueId, gender: user.gender === 'MALE' ? 'FEMALE' : 'MALE' }})
    usersToNotify.forEach(e => {
      let online = isUserOnline(e.id)
      if (online) {
        sendMessageToUser(e.id, 'someone-left-venue', e.id)
      }
    })
    user.VenueId = null
    await user.save()
    return res.json(db.User.generateJwtToken(user))
  } catch (e) {
    console.log(e)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const serveVenueUsers = async (req, res) => {
  try {
    let users = await db.sequelize.query(`
                select u2.id, u2.avatar, u2."firstName", u2."lastName", u2."bornAt",  uc.countries, u1.gender, u2.gender, vhis1."UserId", vhis2."UserId", um."user1Id", um."user2Id", um."user1Response", um."user2Response", um."type", um."accepted",
                       u1."firstName" , vhis1."joinedAt", vhis1."leftAt",
                       u2."firstName", vhis2."joinedAt", vhis2."leftAt" ,
                       vhis1."VenueId" from "VenueUserHistories" vHis1
                        join "VenueUserHistories" vhis2 on
                            date_trunc('DAY',vHis1."joinedAt") = date_trunc('DAY',current_date)
                          and date_trunc('DAY',vHis2."joinedAt") = date_trunc('DAY',current_date)
                          and vhis2."leftAt" is null
                          and vhis1."leftAt" is null
                          and vhis1."UserId" != vhis2."UserId"
                          and vhis1."VenueId" = vhis2."VenueId"
                        join "Users" u1 on u1.id = vhis1."UserId"
                        join "Users" u2 on u2.id = vhis2."UserId"
                        left join "UserMatches" um on
                            (um."user1Id" = vhis1."UserId" and um."user2Id" = vhis2."UserId")
                        or (um."user2Id" = vhis1."UserId" and um."user1Id" = vhis2."UserId")
                        left join "UserBlocks" ub on (ub."userId" = vhis1."UserId" and ub."blockedUserId" = vhis2."UserId") or
                                                     (ub."blockedUserId" = vhis1."UserId" and ub."userId" = vhis2."UserId")
                        LEFT JOIN (select "UserId", string_agg(name,',') as countries from "UserCountries" group by "UserId") uc ON (U2.id = uc."UserId")
                    or (ub."userId" = vhis2."UserId" and ub."blockedUserId" = vhis1."UserId")
                where vhis1."UserId" = :userId
                  and ub."userId" is null --blokk
                  and u1.gender != u2.gender
                  and vhis1."VenueId" = :venueId
                LIMIT :limit
                OFFSET :offset
    `,
      {
        replacements: {
          venueId: req.query.venueId,
          userId: res.locals.user.id,
          limit: req.query.limit ? req.query.limit : 10,
          offset: req.query.offset ? req.query.offset : 0
        },
        type: db.sequelize.QueryTypes.SELECT
      })
    users = users.map(user => {
      return {
        ...user,
        matchStatus: db.UserMatch.calculateMatchStatus(user, res.locals.user.id)
      }
    })
    users = Array.from(new Set(users.map(a => a.id)))
      .map(id => {
        return users.find(a => a.id === id)
      })
    return res.json(users)
  } catch (e) {
    console.log(e)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}


const serveVenueHistory = async (req, res) => {
  try {
    const venues = await db.sequelize.query(`
                    select  distinct t."UserId", t.img, t."VenueId", t.vicinity ,t.name, t.rating, t.joinedAt, t.leftAt 
                    from (select  
                     vhis1."UserId",
                     venues.img,
                     vHis1."VenueId",
                     venues.vicinity,
                     venues.name,
                     venues.rating,
                     STRING_AGG(to_char(vhis1."joinedAt", 'YYYY-MM-DD'), ',')
                     over (partition by vhis1."UserId", vhis1."VenueId", date_trunc('day', vhis1."joinedAt")) as joinedAt,
                     STRING_AGG(to_char(vhis1."leftAt", 'YYYY-MM-DD'), ',')
                     over (partition by vhis1."UserId", vhis1."VenueId", date_trunc('day', vhis1."joinedAt")) as leftAt,
                     count(vhis2."UserId") over (partition by  vhis2."VenueId", date_trunc('day', vhis2."joinedAt"))
             from "Venues" venues
                      join "VenueUserHistories" vhis1 on vhis1."VenueId" = venues.id
                      join "VenueUserHistories" vhis2 on vhis1."VenueId" = vhis2."VenueId" and
                                                         vhis1."UserId" != vhis2."UserId" and
                                                         (vhis1."joinedAt" < vhis2."leftAt" or vhis2."leftAt" is null) and
                                                         vhis1."leftAt" > vhis2."joinedAt"
                      join "Users" users1 on users1.id = vhis1."UserId"
                      join "Users" users2 on users2.id = vhis2."UserId"
                      left JOIN "UserBlocks" blocks on
                     (blocks."userId" = vhis1."UserId" and blocks."blockedUserId" = vhis2."UserId")
                     or  (blocks."userId" = vhis2."UserId" and blocks."blockedUserId" = vhis1."UserId")

             where vhis1."UserId" = :userId
               and vhis1."joinedAt" > current_date - interval :intervalDays day
               and users1.gender != users2.gender and users2.role not in ('ADMIN', 'EMPLOYEE')
               and blocks.id is null
             ORDER BY vhis1."joinedAt"
            ) t
           LIMIT :limit OFFSET :offset`,
      {
        replacements: {
          userId: res.locals.user.id,
          intervalDays: ['PREMIUM_USER'].includes(res.locals.user.role) ? '20' : '1',
          limit: req.query.limit ? req.query.limit : 10,
          offset: req.query.offset ? req.query.offset : 0
        },
        type: db.sequelize.QueryTypes.SELECT
      })
    if (!venues) return res.status(400).json({backendI18nError: 'VENUE_NOT_FOUND'})
    venues.forEach(venue => {
      let joinedAt = venue.joinedat.split(',')
      let leftAt = venue.leftat.split(',')
      venue.timeSlots = []
      joinedAt.forEach((e, index) => {
        venue.timeSlots.push({ joinedAt: e, leftAt: leftAt[index] })
      })
    })
    return res.json(venues)
  } catch (e) {
    console.log(e)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const serveVenueHistoryUsers = async (req, res) => {
  try {
    let users = await db.sequelize.query(`select u2.id, u2.avatar, u2."firstName", u2."lastName", u2."bornAt",  uc.countries, u1.gender, u2.gender, vhis1."UserId", vhis2."UserId", um."user1Id", um."user2Id", um."user1Response", um."user2Response", um."type", um."accepted",
                                                    u1."firstName" , vhis1."joinedAt", vhis1."leftAt",
                                                    u2."firstName", vhis2."joinedAt", vhis2."leftAt" ,
                                                    vhis1."VenueId" from "VenueUserHistories" vHis1
                                            join "VenueUserHistories" vhis2 ON (vHis2."joinedAt" between vHis1."joinedAt" and vhis1."leftAt") or
                                                (vHis1."joinedAt" between vHis2."joinedAt" and vhis2."leftAt") or
                                                (vHis1."joinedAt" > vhis2."joinedAt" and vhis2."leftAt" is null)
                                               and vhis1."UserId" != vhis2."UserId"
                                               and vhis1."VenueId" = vhis2."VenueId"
                                             join "Users" u1 on u1.id = vhis1."UserId"
                                             join "Users" u2 on u2.id = vhis2."UserId"
                                             left join "UserMatches" um on
                                              (um."user1Id" = vhis1."UserId" and um."user2Id" = vhis2."UserId")
                                              or (um."user2Id" = vhis1."UserId" and um."user1Id" = vhis2."UserId")
                                             LEFT JOIN (select "UserId", string_agg(name,',') as countries from "UserCountries" group by "UserId") uc ON (U2.id = uc."UserId")
                                             left join "UserBlocks" ub on (ub."userId" = vhis1."UserId" and ub."blockedUserId" = vhis2."UserId") or
                                                                          (ub."blockedUserId" = vhis1."UserId" and ub."userId" = vhis2."UserId")
                                             where vhis1."UserId" = :userId
                                               and ub."userId" is null --blokk
                                               and u1.gender != u2.gender
                                               and vhis1."VenueId" = :venueId
                                               and date_trunc('DAY',vHis1."joinedAt") = date_trunc('DAY',to_date(:date,'YYYY-MM-DD'))
                                             LIMIT :limit
                                             OFFSET :offset`,
      {
        replacements: {
          userId: res.locals.user.id,
          venueId: req.query.venueId,
          date: req.query.date,
          limit: req.query.limit ? req.query.limit : 10,
          offset: req.query.offset ? req.query.offset : 0
        },
        type: db.sequelize.QueryTypes.SELECT
      })
    let mappedUsers = []
    users.forEach(user => {
      console.log(user.id)
      console.log(mappedUsers.map(e => e.id).join(', '))
      if (!mappedUsers.some(e => e.id === user.id)) {
        mappedUsers.push({
          ...user,
          matchStatus: db.UserMatch.calculateMatchStatus(user, res.locals.user.id)
        })
      }
    })
    return res.json(mappedUsers)
  } catch (e) {
    console.log(e)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}


const recommendVenue = async (req, res) => {
  const venues = await db.sequelize.query(`select * from "VenueRequests" vr where vr."userId" = :userId and date_trunc('DAY', vr."createdAt") = date_trunc('DAY', current_date)`,
    { replacements: { userId: res.locals.user.id }, type: db.sequelize.QueryTypes.SELECT })
  if (venues && venues.length > 4) {
    return res.status(400).json({backendI18nError: 'RECOMMEND_VENUE_LIMIT_REACHED'})
  }
  try {
    await db.VenueRequest.create({
      userId: res.locals.user.id,
      placeName: req.body.placeName,
      lat: req.query.lat,
      long: req.query.long,
      location: {type: 'Point', coordinates: [req.query.lat, req.query.long]},
      createdAt: new Date(),
      updatedAt: new Date()
    })
    return res.json("VENUE_REQUEST_CREATED")
  } catch (e) {
    console.log(e)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

module.exports = {
  serveVenues,
  joinVenue,
  serveVenueUsers,
  recommendVenue,
  leaveVenue,
  serveVenueHistory,
  serveVenueHistoryUsers,
  serveFeaturedVenues,
}
