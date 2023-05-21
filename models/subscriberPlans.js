'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubscriberPlan extends Model {

  };
  SubscriberPlan.init({
    productId: { type: DataTypes.STRING, allowNull: false },
    i18NTitle: { type: DataTypes.STRING, allowNull: false },
    lengthInMonths: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    sequelize,
    modelName: 'SubscriberPlan',
  });
  return SubscriberPlan;
};