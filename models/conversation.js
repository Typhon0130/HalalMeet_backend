'use strict';
const { Model, Op } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    static associate(models) {
    }
  }
  Conversation.init({
    directMessageRequired: { type: DataTypes.BOOLEAN, defaultValue: false },
    venueId: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    sequelize,
    modelName: 'Conversation',
  });
  return Conversation;
};