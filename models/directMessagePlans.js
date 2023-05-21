'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DirectMessagePlan extends Model {

  }
  DirectMessagePlan.init({
    productId: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    sequelize,
    modelName: 'DirectMessagePlan',
  });
  return DirectMessagePlan;
};