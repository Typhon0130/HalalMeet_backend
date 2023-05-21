'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Internalization extends Model {
    static associate(models) {
    }
  }
  Internalization.init({
    language: DataTypes.STRING,
    i18nName: DataTypes.STRING,
    name: DataTypes.STRING,
    type: { type: DataTypes.ENUM, values: ['SYSTEM', 'ICE_BREAKER', 'INTEREST', 'OTHER'] },
  }, {
    sequelize,
    modelName: 'Internalization',
  });
  return Internalization;
};