const ConversationService = require("../services/ConversationService");
const db = require("../models/index");
const {sendNotificationsToUsers} = require("./socketio");
const { sendMessageToUser, isUserInRoom, isUserOnline } = require("./socketio");
const { Model, Op } = require('sequelize');

module.exports = (io, socket, token, mobileSockets) => {
  socket.on('join-conversation', async ({ receiverId, senderId }) => {
    try {
      console.log('JOINING CONVERSATION WITH ' + receiverId)
      if (receiverId === token.id) return;
      const conversation = await ConversationService.findOrCreateConversation(senderId ? senderId : token.id, receiverId)
      await db.Message.update({ seen: true }, { where: { ConversationId: conversation.id, receiver: token.id  } })
      socket.join('conversation:' + conversation.id, function() {
        console.log("Socket now in rooms", socket.rooms);
        socket.emit('prior-messages', { id: conversation.id, Messages: conversation && conversation.Messages ? conversation.Messages.slice(0, 20) : [] });
      });
    } catch(error) {
      console.log(error)
    }
  });

  socket.on('get-prior-messages', async ({ userId, page, conversationId }) => {
    try {
      const messages = await db.Message.findAndCountAll({ where: {
          receiver: { [Op.or]: [userId, token.id] },
          sender: { [Op.or]: [userId, token.id] }
        }, order: [['createdAt', 'DESC']], limit: 20, offset: page * 20})
      socket.emit('prior-messages', { id: conversationId, Messages: messages.rows });
    } catch(error) {
      console.log(error)
    }
  });

  socket.on('leave-conversation', async (conversationId) => {
    try {
      console.log('LEAVE CONVERSATION ' + conversationId)
      socket.leave('conversation:' + conversationId)
    } catch(error) {
      console.log(error)
    }
  });

  socket.on('send-message', async ({ text, receiverId, isDirectMessage, venueId, senderId }) => {
    try {
      if (receiverId === (senderId ? senderId : token.id)) return;
      console.log('SENDING_MESSAGE TO: ' + receiverId + ' MESSAGE: ' + text)
      const blockedMe = await db.UserBlock.findOne({ where: { userId: receiverId, blockedUserId: token.id } })
      const blockedHim = await db.UserBlock.findOne({ where: { userId: token.id, blockedUserId: receiverId } })
      if (blockedMe || blockedHim) {
        socket.emit('incoming-message', { text: 'YOU_TWO_BLOCKED' })
        return;
      }

      const user = await db.User.findByPk(senderId ? senderId : token.id)
      let userMatch = await db.UserMatch.findOne({ where: {
        user1Id: { [Op.or]: [user.id, receiverId] },
        user2Id: { [Op.or]: [user.id, receiverId] } }
      })
      if (!userMatch || !userMatch.accepted || userMatch.user2Response !== true) {
        if (isDirectMessage) {
          if (user.nrOfDirectMessages === 0) {
            await sendNotificationsToUsers([{
              to: user.mobileToken,
              sound: "default",
              title: 'You ran out of direct messages.',
              body: 'Do not miss out on meeting the one',
              data: { type: 'NOT_ENOUGH_DIRECT_MESSAGE', data: { message: 'NOT_ENOUGH_DIRECT_MESSAGE' } }
            }])
            return;
          }
          if (!userMatch) {
           userMatch = await db.UserMatch.create({
             user1Id: user.id,
             user2Id: receiverId,
             user1Response: true,
             user2Response: false,
             type: 'DIRECT_MESSAGE',
             accepted: false,
             venueId: venueId
           })
            user.nrOfDirectMessages = user.nrOfDirectMessages - 1

          } else {
            if (userMatch.user1Id === user.id) {
              // userMatch.user2Response = true
              userMatch.user1Response = true;
              user.nrOfDirectMessages = user.nrOfDirectMessages - 1
            } else {
              // userMatch.user1Response = true
              userMatch.user2Response = true
            }
          }
          //user.nrOfDirectMessages = user.nrOfDirectMessages - 1
        } else {
          console.log('User Matched By Direct Message')
        }
        // user.nrOfDirectMessages = user.nrOfDirectMessages - 1
      }
      if (!userMatch) {
        console.log('YOU TWO ARE NOT MATCHED')
        return;
      }
      const conversation = await ConversationService.findOrCreateConversation(user.id, receiverId)
      let userIsUser1 = (userMatch.user1Id === user.id)
      let matchedUser = await db.User.findByPk(userIsUser1 ? userMatch.user2Id : userMatch.user1Id, { attributes: ['avatar', 'firstName', 'lastName', 'id', 'mobileToken'] })
      if (userMatch.accepted === false) {
        conversation.directMessageRequired = true
        if (userMatch.user2Id === user.id) {
          conversation.directMessageRequired = false
          userMatch.accepted = true
          let mobileNotifications = []
          if (matchedUser.mobileToken) {
            mobileNotifications.push({
              to: matchedUser.mobileToken, sound: "default", title: 'You got a new Match!', body: 'Click me to see who liked you.',
              data: { type: 'NEW_MATCH', data: {
                  matchedUser: matchedUser,
                } }
            })
          }
          await sendNotificationsToUsers(mobileNotifications)
        }
      }
      if (venueId) conversation.venueId = venueId

      const message = await ConversationService.createMessage(text, user, receiverId, isDirectMessage)
      if(isUserInRoom(userMatch.employeeId && !senderId ? userMatch.employeeId : receiverId, 'conversation:' + message.ConversationId)) {
        message.seen = true
        sendMessageToUser(userMatch.employeeId && !senderId ? userMatch.employeeId : receiverId, 'incoming-message', message)
      } else {
        if (userMatch.employeeId !== user.id) {
          let receiverUser = await db.User.findByPk(receiverId)
          if (isUserOnline(userMatch.employeeId && !senderId ? userMatch.employeeId : receiverId)) {
            sendMessageToUser(userMatch.employeeId && !senderId ? userMatch.employeeId : receiverId, 'NEW_MESSAGE', user.firstName)
          } else if (receiverUser.mobileToken) {
            await sendNotificationsToUsers([{
              to: receiverUser.mobileToken,
              sound: "default",
              title: user.firstName + ' just sent you a new message.',
              body: 'Click here to check',
              channelId: 'chat-message',
              data: { type: 'NEW_MESSAGE', data: { firstName: user.firstName, userId: user.id, avatar: user.avatar } },
              badge:1
            }])
          }
        } else {
          sendMessageToUser(userMatch.employeeId, 'notification', {
            type: 'info',
            messageType: 'NEW_MESSAGE',
            data: message,
            duration: 1500
          })
        }
      }
      socket.emit('incoming-message', message)
      await message.save()
      await conversation.save()
      await userMatch.save()
      await user.save()
    } catch(error) {
      console.log(error)
    }
  });

  socket.on('find-contacted-matches', async ({ limit, offset}) => {
    try {
      let matches = await db.sequelize.query(`select COALESCE(u1."firstName", u2."firstName") as firstName, COALESCE(u1."lastName", u2."lastName") as lastName, COALESCE(u1."avatar", u2."avatar") as avatar, mess.sender, mess.receiver, mess.text, mess."seen", match.type, mess."createdAt", match.accepted
                                                from "UserMatches" match
                                                join (select t.sender, receiver , t.text, t.seen, t."createdAt" from "Messages" t where t."createdAt" in (
                                                    (select max("createdAt") from "Messages" k where (k.receiver = :userId  or k.sender = :userId) group by k."ConversationId"))
                                                ) mess on
                                                        (match."user2Id" = mess.receiver and match."user1Id" = mess.sender) or
                                                        (match."user2Id" = mess.sender and match."user1Id" = mess.receiver)
                                                         left join "UserBlocks" ub on (ub."userId" = match."user1Id" and ub."blockedUserId" = match."user2Id") or
                                                                                      (ub."blockedUserId" = match."user1Id" and ub."userId" = match."user2Id")
                                                         left join "Users" u1 on mess.sender = u1.id and u1.id != :userId
                                                         left join "Users" u2 on mess.receiver = u2.id and u2.id != :userId
                                                    or (ub."userId" = match."user2Id" and ub."blockedUserId" = match."user1Id")
                                                where (match."user1Id" = :userId or match."user2Id" = :userId)
                                                   and match."user1Response" = true or match."user2Response" = true
--                                     old code    and match."user1Response" = true and match."user2Response" = true
                                                  and coalesce(ub."userId",0) != :userId
                                                  and (coalesce(ub."blockedUserId",0) != :userId or coalesce(ub."userId",0) = :userId)
                                                ORDER BY mess."createdAt" DESC
                                                fetch first :limit rows only
                                                OFFSET :offset;`,
        {
          replacements: {
            userId: token.id,
            limit: limit ? limit : 10,
            offset: offset ? offset : 0
          },
          type: db.sequelize.QueryTypes.SELECT
        })
      matches = matches.map(e => {
        return {
          ...e,
          online: isUserOnline(token.id === e.sender ? e.receiver : e.sender)
        }
      })
      socket.emit('contacted-matches', matches)
    } catch (e) {
      console.log(e)
    }
  })

  socket.on('find-un-contacted-matches', async ({ limit, offset}) => {
    try {
      let matches = await db.sequelize.query(`select u.id, u.avatar, u."firstName", u."lastName" , mess.sender, mess.receiver
                                                from "UserMatches" match
                                                         left join "Messages" mess on
                                                        (match."user2Id" = mess.receiver and match."user1Id" = mess.sender) or
                                                        (match."user2Id" = mess.sender and match."user1Id" = mess.receiver)
                                                         left join "Users" u on (u."id" = match."user1Id" or u."id" = match."user2Id") and u.id != :userId
                                                         left join "UserBlocks" ub on (ub."userId" = match."user1Id" and ub."blockedUserId" = match."user2Id") or
                                                                                      (ub."blockedUserId" = match."user1Id" and ub."userId" = match."user2Id")
                                                    or (ub."userId" = match."user2Id" and ub."blockedUserId" = match."user1Id")
                                                where mess.id is null
                                                  and match."user1Response" = true and match."user2Response" = true
                                                  and (match."user1Id" = :userId or match."user2Id" = :userId)
                                                  and match."accepted" = true
                                                  and coalesce(ub."userId",0) != :userId
                                                  and coalesce(ub."blockedUserId",0) != :userId`,
        {
          replacements: {
            userId: token.id,
          },
          type: db.sequelize.QueryTypes.SELECT
        })
      matches = matches.map(e => {
        return {
          ...e,
          online: isUserOnline(e.id)
        }
      })
      socket.emit('un-contacted-matches', matches)
    } catch (e) {
      console.log(e)
    }
  })

  socket.on('find-employee-matches', async () => {
    try {
      const matches = await db.sequelize.query(`
                  select u1.id as user1Id, u1."firstName" as user1FirstName, u1."lastName" as user1LastName, u1."avatar" as user1Avatar,
                         u2.id as user2Id, u2."firstName" as user2FirstName, u2."lastName" as user2LastName, u2."avatar" as user2Avatar,
                         um.id as matchid
                  from "UserMatches" um
                           join "Users" u1 on  u1.id = um."user1Id"
                           join "Users" u2 on  u2.id = um."user2Id"
                  where um."employeeId" = :userId and um."user1Response" = true and um."user2Response" = true
        `,
        {
          replacements: {
            userId: token.id
          },
          type: db.sequelize.QueryTypes.SELECT
        })
      socket.emit('employee-matches', matches)
    } catch (e) {
      console.log(e)
    }
  })
}
