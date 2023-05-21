'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LocationSubscriber extends Model {
    static associate(models) {
    }
  }
  LocationSubscriber.init({
    email: DataTypes.STRING,
    city: DataTypes.STRING,
    region: DataTypes.STRING,
    country: DataTypes.STRING,
    location: DataTypes.GEOMETRY('POINT'),
  }, {
    sequelize,
    modelName: 'LocationSubscriber',
  });
  return LocationSubscriber;
};