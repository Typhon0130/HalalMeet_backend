'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserBlock extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  UserBlock.init({
    userId: DataTypes.INTEGER,
    blockedUserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'UserBlock',
  });
  return UserBlock;
};