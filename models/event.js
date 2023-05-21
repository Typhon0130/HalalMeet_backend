'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static associate(models) {
    }
  }
  Event.init({
    templateName: DataTypes.STRING,
    eventName: { type: DataTypes.ENUM, values: ['REGISTRATION', 'PAUSE', 'DELETION', 'CUSTOM'] },
  }, {
    sequelize,
    modelName: 'Event',
  });
  return Event;
};