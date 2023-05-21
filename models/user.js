'use strict';
const { Model } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
    }
  }
  User.init({
    phoneNumber: { type: DataTypes.STRING, allowNull: true, unique: true },
    email: { type: DataTypes.STRING, allowNull: true, unique: false },
    height: { type: DataTypes.INTEGER, allowNull: true },
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
    selfie: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true, defaultValue: [] },
    premiumUntil: { type: DataTypes.DATE, allowNull: true },
    images: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    ranOutOfSwipesAt: { type: DataTypes.DATE, allowNull: true, defaultValue: new Date() },
    highlights: { type: DataTypes.TEXT, allowNull: true },
    password: { type: DataTypes.STRING,  allowNull: true },
    encryptedPassword: { type: DataTypes.STRING, allowNull: true},
    swipesLeft: { type: DataTypes.INTEGER, allowNull: true },
    notificationsReceived: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    sequelize,
    modelName: 'User'
  }, {
    indexes: [
      {
        unique: false,
        fields: ['swipeIso', 'swipeRegion', 'swipeCity', 'gender', 'bornAt', 'state']
      }
    ]
  });
  User.generateJwtToken = (user) => {
    return {
      token: jwt.sign(
        {
          id: user.id,
          gender: user.gender,
          state: user.state,
          role: user.role,
          serviceArea: user.serviceArea,
          verificationStatus: user.verificationStatus
        },
        process.env.JWT_SECRET
      )
    }
  }
  User.saveProfile = async (req, user, db) => {
    try {
      let { firstName, lastName, countries, interests, highlights, languages, gender, email, height, bornAt, highestEducation, martialStatus, hasChildren, occupation } = req.body
      user.firstName = firstName
      user.lastName = lastName
      user.gender = gender
      user.bornAt = moment.utc(bornAt).startOf('day').toDate()
      user.email = email
      user.height = height ? Number(height) : null
      highlights && highlights !== 'null' ? user.highlights = highlights : null
      user.highestEducation = highestEducation && highestEducation !== 'null' ? highestEducation : null
      if (martialStatus && martialStatus !== 'null') {
        user.martialStatus = martialStatus
      } else {
        user.martialStatus = null
      }
      if (hasChildren === 'true') {
        hasChildren = true
      } else if (hasChildren === 'false') {
        hasChildren = false
      } else {
        hasChildren = null
      }
      user.hasChildren = hasChildren !== '' && hasChildren !== null && hasChildren !== 'null' && hasChildren !== undefined ? hasChildren : null
      user.occupation = occupation && occupation !== 'null' && occupation.length > 0 ? occupation : null

      if (countries) {
        db.UserCountry.destroy({ where: { UserId: user.id} })
        countries.forEach(country => {
          if (country) {
            db.UserCountry.create({name: country.name.toLowerCase(), UserId: user.id})
          }
        })
      }

      if (languages) {
        db.UserLanguage.destroy({ where: { UserId: user.id} })

        languages.forEach(language => {
          if (language) db.UserLanguage.create({name: language, UserId: user.id})
        })
      }

      if (interests) {
        db.UserInterest.destroy({ where: { UserId: user.id} })
        interests.forEach(interest => {
          db.UserInterest.create({i18nName: interest.i18nName, icon: interest.icon, UserId: user.id})
        })
      }
    } catch (error) {
      console.log(error)
      return 'INTERNAL_SERVER_ERROR'
    }
  }
  return User;
};