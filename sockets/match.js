const db = require('../models/index')
const rawSqlService = require("../services/rawSqlService");
const { Model, Op } = require('sequelize');
const moment = require('moment');
const {isUserOnline} = require("./socketio");
const {sendMessageToUser} = require("../services/AuthService");
const {sendNotificationsToUsers} = require("./socketio");

module.exports = (io, socket, token, mobileSockets) => {
  socket.on('find-possible-matches', async ({ countries, minBornAt, maxBornAt }) => {
    console.log('FIND POSSIBLE MATCHES countries: ' + countries, ' + minbornat: ' + minBornAt + ' maxbornat: ' + maxBornAt)
    try {
      const user = await db.User.findOne({ where: { id: token.id }, raw: true })
      let matches = await db.sequelize.query(rawSqlService.buildFindPossibleMatchesQuery(countries), {
        replacements: {
          userId: user.id,
          userGender: user.gender,
          limit: 33,
          city: user.swipeCity,
          region: user.swipeRegion,
          country: user.swipeIso,
          freezeLocations: user.freezeLocation ? [false] : [true, false],
          minBornAt: minBornAt ? moment().subtract(minBornAt, 'years').format('YYYY-MM-DD') : '1000-01-01',
          maxBornAt: maxBornAt ? moment().subtract(maxBornAt >= 50 ? 150 : maxBornAt, 'years').format('YYYY-MM-DD') : '2100-01-01',
          countries: countries && countries.length > 0 ? countries.map(e => e.name.toLowerCase()) : null,
        },
        raw: true,
        mapToModel: false,
        type: db.Sequelize.QueryTypes.SELECT
      });
      const uniqueArray = matches.filter((object,index) => index === matches.findIndex(obj => obj.id === object.id));
      socket.emit('possible-matches', uniqueArray)
    } catch(error) {
      console.log(error)
    }
  });

  socket.on('do-match', async ({ userId, liked, type, venueName, venueId, wasDirectMessage }) => {
    console.log('DO MATCH TYPE: ' + type + ' ID: ' + userId)
    try {
      const user = await db.User.findByPk(token.id)
      if (type === 'SWIPE' && !wasDirectMessage) {
        if (user.swipesLeft <= 0 && user.role !== 'PREMIUM_USER' && liked) {
          socket.emit('swipe-limit-reached')
          return;
        } else if (user.role !== 'PREMIUM_USER' && liked === true) {
          if (user.swipesLeft === 1) {
            user.ranOutOfSwipesAt = new Date()
          }
          user.swipesLeft = user.swipesLeft - 1
          await user.save()
        }
      }
      let userMatch = await db.UserMatch.findOne({ where: {
          user1Id: { [Op.or]: [user.id, userId] },
          user2Id: { [Op.or]: [user.id, userId] }
      }})
      if (!userMatch) {
        userMatch = await db.UserMatch.create({ user1Id: user.id, user2Id: userId, user1Response: !!liked, type: type, accepted: false, venueId: venueId, user1Seen: false, user2Seen: false })
      }
      if (userMatch && userMatch.user1Response && userMatch.user2Response) return;
      const userIsUser1 = userMatch.user1Id === user.id
      let matchedUser = await db.User.findByPk(userIsUser1 ? userMatch.user2Id : userMatch.user1Id, { attributes: ['avatar', 'firstName', 'lastName', 'id', 'mobileToken', 'VenueId'] })
      if (userIsUser1) userMatch.user1Response = !!liked
      else if (!userIsUser1) userMatch.user2Response = !!liked
      if (userMatch.user1Response && userMatch.user2Response) {
        userMatch.user2Response = true
        userMatch.accepted = true
        userMatch.type = type
        let mobileNotifications = []
        if (type !== 'DIRECT_MESSAGE') {
          if (user.mobileToken) {
            mobileNotifications.push({
              to: user.mobileToken, sound: "default", title: 'You got a new Match!', body: 'Click me to see who liked you.',
              data: { type: 'NEW_MATCH', data: {
                  matchedUser: matchedUser
                } }
            })
          }
          if (matchedUser.mobileToken) {
            mobileNotifications.push({
              to: matchedUser.mobileToken, sound: "default", title: 'You got a new Match!', body: 'Click me to see who liked you.',
              data: { type: 'NEW_MATCH', data: {
                  matchedUser: user,
                } }
            })
          }
          await sendNotificationsToUsers(mobileNotifications)
        }
        await userMatch.save()
      } else {
        if (type === 'WAVE') {
          let venue = await db.Venue.findOne({ where: { name: venueName } })
          if (venue) {
            if (isUserOnline(matchedUser.id)) {
              sendMessageToUser(matchedUser.id, 'WAVED_AT_YOU', { firstName: user.firstName, venueName: venue.name })
            } else if (matchedUser.mobileToken) {
              await sendNotificationsToUsers([{
                to: matchedUser.mobileToken,
                sound: "default",
                title: user.firstName + ' just waved at you at ' + venueName,
                body: 'Click me to see who liked you.',
                data: { type: 'WAVED_AT_YOU', data: { venueName, firstName: user.firstName, venueId: venue.id, isOld: matchedUser.VenueId === venue.id } }
              }])
            }
          }
        }
      }
      userMatch.type = type
      await userMatch.save()
    } catch(error) {
      console.log(error)
    }
  });

}