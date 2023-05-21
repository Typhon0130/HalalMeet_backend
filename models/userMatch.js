'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserMatch extends Model {
    static associate(models) {
      // define association here
    }
  }
  UserMatch.init({
    user1Id: DataTypes.INTEGER,
    user1Response: DataTypes.BOOLEAN,
    user2Id: DataTypes.INTEGER,
    user2Response: DataTypes.BOOLEAN,
    type: { type: DataTypes.ENUM, values: ['DIRECT_MESSAGE', 'SWIPE', 'WAVE'] },
    seen: { type: DataTypes.BOOLEAN, defaultValue: false },
    user1Seen: { type: DataTypes.BOOLEAN, defaultValue: false },
    user2Seen: { type: DataTypes.BOOLEAN, defaultValue: false },
    accepted: { type: DataTypes.BOOLEAN, defaultValue: false },
    venueId: { type: DataTypes.INTEGER, allowNull: true },
    employeeId: { type: DataTypes.INTEGER, allowNull: true },
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'UserMatch',
  });
  UserMatch.calculateMatchStatus = (match, userId) => {
    const isUserUser1 = match.user1Id === userId
    if (match.user1Response === true && match.user2Response && match.accepted === true) return 'MATCHED'
    if (isUserUser1 && match.user1Response === true && match.user2Response !== true) return 'LIKED'
    if (!isUserUser1 && match.user2Response === true && match.user1Response !== true) return 'LIKED'
    if (isUserUser1 && match.user1Response === false) return 'PASSED'
    if (!isUserUser1 && match.user2Response === false) return 'PASSED_ME'
    if (!isUserUser1 && match.user1Response === true) return 'LIKED_ME'
    else return 'UNKNOWN'
  }
  return UserMatch;
};