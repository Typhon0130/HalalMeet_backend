const db = require('../models')
const { Model, Op } = require('sequelize');

const createMessage = async (text, user, receiver, isDirectMessage) => {
  const prevMsg = await db.Message.findOne({ where : { sender: receiver, receiver: user.id }})
  let isResponse
  if (prevMsg) {
    isResponse = true
  } else {
    isResponse = false
  }
  let newmsg = {
    text,
    senderInfo: {
      firstName: user.firstName,
      id: user.id,
      lastName: user.lastName,
      avatar: user.avatar,
      bornAt: user.bornAt,
    },
    sender: user.id,
    isResponse: isResponse,
    receiver: receiver,
    isDirectMessage: isDirectMessage,
    createdAt: Date.now()
  }
  const message = await db.Message.create(newmsg)
  const conversation = await findOrCreateConversation(user.id, receiver)
  message.setConversation(conversation)
  return message
};

const findOrCreateConversation = async (user1Id, user2Id) => {
  const conversation = await db.Conversation.findOne({
    where: {
      user1Id: { [Op.or]: [user1Id, user2Id] },
      user2Id: { [Op.or]: [user1Id, user2Id] }
    },
    include: [ db.Message ],
    order: [[ db.Message, 'createdAt', 'DESC']]
  })
  if(conversation) {
    return conversation;
  } else {
    return db.Conversation.create({
      user1Id: user1Id,
      user2Id: user2Id
    }, {
      include: [db.Message],
      order: [[db.Message, 'createdAt', 'DESC']]
    })
  }
};


module.exports = {
  findOrCreateConversation,
  createMessage
}