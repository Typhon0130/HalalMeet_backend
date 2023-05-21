'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DeletionReason extends Model {

  };
  DeletionReason.init({
    reason: { type: DataTypes.STRING, allowNull: false },
    phoneNumber: { type: DataTypes.STRING, allowNull: true, unique: false },
    email: { type: DataTypes.STRING, allowNull: true, unique: false },
    height: { type: DataTypes.STRING, allowNull: true },
    smsToken: { type: DataTypes.STRING, allowNull: true },
    smsTokenExpiresAt: { type: DataTypes.DATE, allowNull: true },
    serviceArea: { type: DataTypes.INTEGER, allowNull: true },
    nrOfDirectMessages: { type: DataTypes.INTEGER, defaultValue: 0 },
    mobileToken: { type: DataTypes.STRING, allowNull: true },
    freezeLocation: { type: DataTypes.BOOLEAN, defaultValue: false },
    swipeCity: { type: DataTypes.STRING, allowNull: true },
    swipeRegion: { type: DataTypes.STRING, allowNull: true },
    swipeIso: { type: DataTypes.STRING, allowNull: true },
    swipeCountry: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.GEOMETRY('POINT') },
    lat: { type: DataTypes.STRING, allowNull: true },
    long: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    region: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    iso: { type: DataTypes.STRING, allowNull: true },
    VenueId: { type: DataTypes.INTEGER, allowNull: true },
    lastName: { type: DataTypes.STRING, allowNull: true },
    firstName: { type: DataTypes.STRING, allowNull: true },
    occupation: { type: DataTypes.STRING, allowNull: true},
    highestEducation: { type: DataTypes.ENUM, values: ['HIGH_SCHOOL', 'COLLEGE', 'UNIVERSITY', 'POST_GRAD'], allowNull: true},
    martialStatus: { type: DataTypes.ENUM, values: ['DIVORCED', 'NEVER_MARRIED', 'SINGLE'], allowNull: true},
    hasChildren: { type: DataTypes.BOOLEAN, allowNull: true},
    role: { type: DataTypes.ENUM, values: ['USER', 'ADMIN', 'PREMIUM_USER', 'EMPLOYEE', 'FAKE_USER'], defaultValue: 'USER', allowNull: false },
    state: { type: DataTypes.ENUM, values: ['INITIATED', 'VERIFIED', 'ON_BOARDED', 'BANNED', 'PAUSED'], defaultValue: 'INITIATED', allowNull: false },
    verificationStatus: { type: DataTypes.ENUM, values: ['NOT_INITIATED', 'WAITING_FOR_VERIFICATION', 'VERIFIED', 'REJECTED'], defaultValue: 'NOT_INITIATED', allowNull: false },
    bornAt: { type: DataTypes.DATE, allowNull: true },
    gender: { type: DataTypes.ENUM, values: ['MALE', 'FEMALE'], allowNull: true },
    avatar: { type: DataTypes.STRING, allowNull: true },
    selfie: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    premiumUntil: { type: DataTypes.DATE, allowNull: true },
    images: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    highlights: { type: DataTypes.TEXT, allowNull: true },
    password: { type: DataTypes.STRING,  allowNull: true },
    encryptedPassword: { type: DataTypes.STRING, allowNull: true},
    swipesLeft: { type: DataTypes.INTEGER, allowNull: true },
    updatedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'DeletionReason',
  });
  return DeletionReason;
};