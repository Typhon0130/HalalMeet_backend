const db = require('../models');
const jwt = require('jsonwebtoken');
const _ = require('lodash')
const { Expo } = require("expo-server-sdk");
const expo = new Expo();

let mobileSockets = {};
let logOutTimers = {};
let socketIO

const isUserOnline = (userId) => {
  if (mobileSockets[userId]) {
    return true
  }
  return false
}

const sendMessageToUser = (userId, topic, data) => {
  if (mobileSockets[userId]) {
    socketIO.to(mobileSockets[userId]).emit(topic, data)
    return true
  }
  return false
}

const sendNotificationsToUsers = async (notifications) => {
  let chunks = expo.chunkPushNotifications(notifications);
  await (async () => {
    for (let chunk of chunks) {
      try {
        let receipts = await expo.sendPushNotificationsAsync(chunk);
        console.log('RECEIPTS: ', receipts);
      } catch (error) {
        console.error('ERROR: ', error);
      }
    }
  })();
}

const isUserInRoom = (userId, room) => {
  if (socketIO.sockets.sockets[mobileSockets[userId]] &&
    socketIO.sockets.sockets[mobileSockets[userId]].rooms[room]) {
    return true
  }
  return false
}

function addLogOutTimerToUser(id, socket) {
  logOutTimers[id] = setTimeout(async () => {
    try {
      const user = await db.User.findByPk(id)
      if (user) {
        if (user.VenueId) {
        await db.VenueUserHistory.update({ leftAt : new Date() }, { where: {
            UserId: id,
            VenueId: user.VenueId ? user.VenueId : null,
            leftAt: { [db.Sequelize.Op.eq]: null }
          }})
        user.VenueId = null
      }
      await user.save()
      await notifyFriendList(id, socket, false)
      delete logOutTimers[id]
      }
    } catch (e) {
      console.log(e)
    }
  }, 1000 * 60 * 15)
}

async function notifyFriendList(userId, socket, joined) {
  try {
    let likedMatches = await db.UserMatch.findAll({ where: { user1Id: userId, accepted: true } })
    let likedMeMatches = await db.UserMatch.findAll({ where: { user2Id: userId, accepted: true } })
    let matches = []
    if (likedMatches && likedMatches.length > 0) matches = [...matches, ...likedMatches]
    if (likedMeMatches && likedMeMatches.length > 0) matches = [...matches, ...likedMeMatches]
    matches.forEach(userMatch => {
      let partnerId = userMatch.user1Id === userId ? userMatch.user2Id : userMatch.user1Id
      if (isUserOnline(partnerId)) {
        socket.to(mobileSockets[partnerId]).emit('friend-activity', { userId, joined});
      }
    })
  } catch (e) {
    console.log(e)
  }
}

const initialize = (io) => {
  socketIO = io
  // io.on('disconnect', async socket => {
  //   delete mobileSockets[Object.keys(mobileSockets).find(key => mobileSockets[key] === socket.id)]
  // })

  io.on('connection', async socket => {
    let token;
    try {
      token = await jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET);
    } catch (e) {
      if (e.name === 'TokenExpiredError') { socket.disconnect() }
      return;
    }
    mobileSockets[token.id] = socket.id;
    if (token.role === 'EMPLOYEE' || token.role === 'ADMIN') {
      let managedProfiles = await db.UserMatch.findAll({ where: { employeeId: token.id }})
      if (managedProfiles) {
        managedProfiles.forEach(e => {
          notifyFriendList(e.user2Id, socket, true)
          mobileSockets[e.user2Id] = socket.id
        })
      }
    } else {
      notifyFriendList(token.id, socket, true)
    }
    if (logOutTimers[token.id]) {
      clearTimeout(logOutTimers[token.id])
    }

    socket.on('im-offline', async (userId) => {
      try {
        console.log(socket.rooms)
        delete mobileSockets[userId]
        Object.keys(socket.adapter.rooms).forEach(e => {
          if (e.includes('conversation')) {
            socket.leave(e)
          }
        })
        notifyFriendList(userId, socket, false)
      } catch (e) {
        console.log(e)
      }
    });

    socket.on('im-online', async (userId) => {
      try {
        console.log('TOGGLING ONLINE', socket.id)
        await notifyFriendList(userId, socket, true)
        mobileSockets[userId] = socket.id;
        if (logOutTimers[token.id]) {
          clearTimeout(logOutTimers[token.id])
        }
        console.log("1MOBILESOCKETS: ", mobileSockets)
      } catch (e) {
        console.log('ERROR IN IM ONLINE', e)
      }
    });

    socket.on('disconnect-me', async ({ userId, employeeMatches}) => {
      console.log('DISCONNECTING SOCKET: ', socket.id)
      addLogOutTimerToUser(userId, socket)
      if (employeeMatches) {
        employeeMatches.forEach(e => {
          delete mobileSockets[e.user2id]
          notifyFriendList(userId, socket, false)
        })
      } else {
        await notifyFriendList(userId, socket, false)
        delete mobileSockets[userId]
      }
      socket.disconnect()
    });

    socket.on('disconnect', async function (reason) {
      try {
        console.log(mobileSockets)
        delete mobileSockets[token.id]
        const user = await db.User.findByPk(token.id)
        if (user && user.role === 'EMPLOYEE') {
          let matches = await db.UserMatch.findAll({ where: { employeeId: token.id }})
          matches.forEach(e => {
            delete mobileSockets[e.user2Id]
            notifyFriendList(e.user2Id, socket, false)
          })
        } else {
          addLogOutTimerToUser(token.id, socket)
          Object.keys(socket.adapter.rooms).forEach(e => {
            socket.leave(e)
          })
          delete mobileSockets[token.id]
        }
      } catch (e) {
        console.log(e)
      }
    });

    require('./conversation')(io, socket, token, mobileSockets)
    require('./match')(io, socket, token, mobileSockets)

  });
}

module.exports = {
  mobileSockets,
  initialize,
  sendMessageToUser,
  sendNotificationsToUsers,
  isUserInRoom,
  isUserOnline
}