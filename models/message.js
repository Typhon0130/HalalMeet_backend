'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
    }
  }
  Message.init({
    text: DataTypes.TEXT(20480),
    senderInfo: DataTypes.JSON,
    seen: { type: DataTypes.BOOLEAN, defaultValue: false },
    sender: DataTypes.INTEGER,
    isResponse: DataTypes.BOOLEAN,
    receiver: DataTypes.INTEGER,
    ConversationId: DataTypes.INTEGER,
    isDirectMessage: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Message',
  });
  return Message;
};