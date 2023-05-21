'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserCountry extends Model {
    static associate(models) {
    }
  }
  UserCountry.init({
    name: { type: DataTypes.STRING },
    UserId: {
      type: DataTypes.INTEGER,
    }
  }, {
    sequelize,
    modelName: 'UserCountry',
  });
  return UserCountry;
};