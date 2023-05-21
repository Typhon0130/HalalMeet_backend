'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserBadge extends Model {
    static associate(models) {
    }
  }
  UserBadge.init({
    userId: DataTypes.INTEGER,
    badge: DataTypes.STRING
  }, {
    indexes: [{ unique: true, fields: ['userId', 'badge'] } ],
    sequelize,
    modelName: 'UserBadge',
    tableName: 'UserBadges',
  });
  return UserBadge;
};