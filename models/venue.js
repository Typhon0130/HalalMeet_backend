'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Venue extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Venue.init({
    name: DataTypes.STRING,
    types: DataTypes.ARRAY(DataTypes.STRING),
    location: DataTypes.GEOMETRY('POINT'),
    city: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    img: DataTypes.STRING,
    rating: { type: DataTypes.STRING, allowNull: true },
    priceLevel: { type: DataTypes.STRING, allowNull: true },
    featured: { type: DataTypes.BOOLEAN, allowNull: true },
    allowAutoNotifications: { type: DataTypes.BOOLEAN, defaultValue: false },
    vicinity: { type: DataTypes.STRING, allowNull: true },
    icon: { type: DataTypes.STRING, allowNull: true },
    user_ratings_total: { type: DataTypes.INTEGER, allowNull: true },
    placeId: { type: DataTypes.STRING },
    updatedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'Venue',
  });
  Venue.mapOnlineCount = (count) => {
    if (!count || (count && count <= 10)) return "0 - 10"
    if (count > 10 && count <= 20) return "10 - 20"
    if (count > 20 && count <= 30) return "20 - 30"
    if (count > 30 && count <= 40) return "30 - 40"
    if (count > 40 && count <= 50) return "40 - 50"
    if (count > 50 && count <= 60) return "50 - 60"
    if (count > 60 && count <= 70) return "60 - 70"
    if (count > 70 && count <= 80) return "70 - 80"
    if (count > 80 && count <= 90) return "80 - 90"
    if (count > 90 && count <= 100) return "90 - 100"
    else return count
  }
  return Venue;
};