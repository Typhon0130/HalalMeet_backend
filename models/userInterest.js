'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserInterest extends Model {
    static associate(models) {
    }
  }
  UserInterest.init({
    icon: { type: DataTypes.STRING },
    i18nName: { type: DataTypes.STRING },
    UserId: {
      type: DataTypes.INTEGER,
    }
  }, {
    sequelize,
    modelName: 'UserInterest',
  });
  return UserInterest;
};