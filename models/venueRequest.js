'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VenueRequest extends Model {
    static associate(models) {
    }
  }
  VenueRequest.init({
    userId: DataTypes.INTEGER,
    placeName: DataTypes.STRING,
    lat: DataTypes.STRING,
    long: DataTypes.STRING,
    location: DataTypes.GEOMETRY('POINT'),
  }, {
    sequelize,
    modelName: 'VenueRequest',
  });
  return VenueRequest;
};