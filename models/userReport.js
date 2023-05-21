'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserReport extends Model {
    static associate(models) {
    }
  }
  UserReport.init({
    reason: { type: DataTypes.STRING },
    user1Id: { type: DataTypes.INTEGER },
    user2Id: { type: DataTypes.INTEGER }
  }, {
    sequelize,
    modelName: 'UserReport',
  });
  return UserReport;
};