'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SiteSettings extends Model {
    static associate(models) {
    }
  }
  SiteSettings.init({
    enabled: DataTypes.BOOLEAN,
    swipeLimit: DataTypes.STRING,
    smsTokenExpirationInMinutes: DataTypes.INTEGER,
    privacyPolicy: DataTypes.TEXT,
    termsAndConditions: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'SiteSettings',
  });
  SiteSettings.findLatestEnabledOrDefault = async function() {
    return SiteSettings.findAll({
      order: [ [ sequelize.fn('COALESCE', 'updated_at'), 'DESC' ]]
    }).then(settings => {
      if (!settings || settings.length === 0) {
        return new SiteSettings({ swipeLimit: 33, enabled: true })
      }
      return settings[0]
    })
  }
  return SiteSettings;
};