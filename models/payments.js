'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
    }
  }
  Payment.init({
    userId: DataTypes.INTEGER,
    price: DataTypes.STRING,
    productType: DataTypes.STRING,
    orderID: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};
