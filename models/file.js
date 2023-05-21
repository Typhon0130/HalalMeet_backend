'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    static associate(models) {
      // define association here
    }
  }
  File.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'File',
  });
  return File;
};