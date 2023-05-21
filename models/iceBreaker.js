'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class IceBreaker extends Model {

  };
  IceBreaker.init({
    i18nName: { type: DataTypes.STRING, allowNull: false },
    language: { type: DataTypes.STRING, allowNull: false },
  }, {
    sequelize,
    modelName: 'IceBreaker',
  });
  return IceBreaker;
};