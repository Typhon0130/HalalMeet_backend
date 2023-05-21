'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServiceArea extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  ServiceArea.init({
    enabled: { type: DataTypes.BOOLEAN, allowNull: false },
    iso: { type: DataTypes.STRING },
    featuredVenueDiscoveryDistance: { type: DataTypes.INTEGER },
    label: { type: DataTypes.STRING, allowNull: false },
    languageSpoken: { type: DataTypes.STRING, allowNull: false }
  }, {
    sequelize,
    modelName: 'ServiceArea',
  });
  ServiceArea.findEnabled = async (country) => {
    const countryArea = await ServiceArea.findOne({ where: { enabled: true, iso: country } } )
    if (countryArea) return countryArea
  }
  return ServiceArea;
};