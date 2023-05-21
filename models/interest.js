'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Interest extends Model {

  };
  Interest.init({
    i18nName: { type: DataTypes.STRING, allowNull: false },
    icon: { type: DataTypes.STRING, allowNull: false },
  }, {
    sequelize,
    modelName: 'Interest',
  });
  return Interest;
};