'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GooglePlaces extends Model {
    static associate(models) {
    }
  }
  GooglePlaces.init({
    name: DataTypes.STRING,
    types: DataTypes.ARRAY(DataTypes.STRING),
    location: DataTypes.GEOMETRY('POINT'),
    city: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    img: DataTypes.JSON,
    rating: { type: DataTypes.STRING, allowNull: true },
    priceLevel: { type: DataTypes.STRING, allowNull: true },
    featured: { type: DataTypes.BOOLEAN, allowNull: true },
    vicinity: { type: DataTypes.STRING, allowNull: true },
    icon: { type: DataTypes.STRING, allowNull: true },
    user_ratings_total: { type: DataTypes.INTEGER, allowNull: true },
    placeId: { type: DataTypes.STRING, unique: true }
  }, {
    sequelize,
    modelName: 'GooglePlaces',
  });
  return GooglePlaces;
};