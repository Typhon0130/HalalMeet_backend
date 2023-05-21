'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserLanguage extends Model {
    static associate(models) {
    }
  }
  UserLanguage.init({
    name: { type: DataTypes.STRING },
    UserId: {
      type: DataTypes.INTEGER,
    }
  }, {
    sequelize,
    modelName: 'UserLanguage',
  });
  return UserLanguage;
};