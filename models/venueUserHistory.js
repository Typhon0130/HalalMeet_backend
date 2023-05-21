'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class VenueUserHistory extends Model {
    static associate(models) {
      // define association here
    }
  }
  VenueUserHistory.init({
    UserId: { type: DataTypes.INTEGER },
    VenueId: { type: DataTypes.INTEGER },
    joinedAt: { type: DataTypes.DATE },
    leftAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'VenueUserHistory',
    timestamps: true
  });
  return VenueUserHistory;
};