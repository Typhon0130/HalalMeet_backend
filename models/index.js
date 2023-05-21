'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config.json')[env];
const db = {};

let sequelize = new Sequelize(config.database, config.username, config.password, config);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  // db[modelName].sync({ force: true });
});

// db.Message.sync({force: true})
// db.Conversation.sync({force: true})
// db.VenueUserHistory.sync({force:true})
// db.User.sync({force:true})
// db.Venue.sync({force:true})
// db.VenueRequest.sync({force:true})
// db.Message.sync({force:true})
setTimeout(() => {
  db.User.hasMany(db.UserCountry, { foreignKey: 'UserId' })
  db.UserCountry.belongsTo(db.User, { foreignKey: 'UserId' })

  db.User.hasMany(db.UserLanguage, { foreignKey: 'UserId' })
  db.UserLanguage.belongsTo(db.User, { foreignKey: 'UserId' })

  db.User.hasMany(db.UserInterest, { foreignKey: 'UserId' })
  db.UserInterest.belongsTo(db.User, { foreignKey: 'UserId' })

  db.Interest.hasMany(db.UserInterest)
  db.UserInterest.belongsTo(db.Interest)

  db.User.hasMany(db.UserBadge, { foreignKey: 'userId' })
  db.UserBadge.belongsTo(db.User, { foreignKey: 'userId' })

  db.User.hasMany(db.Payment, { foreignKey: 'userId' })
  db.Payment.belongsTo(db.User, { foreignKey: 'userId' })

  db.User.hasMany(db.UserBlock, { foreignKey: 'userId' })
  db.UserBlock.belongsTo(db.User, { foreignKey: 'userId' })
  db.User.hasMany(db.UserBlock, { foreignKey: 'blockedUserId' })
  db.UserBlock.belongsTo(db.User, { foreignKey: 'blockedUserId' })

  db.User.hasMany(db.UserMatch, { foreignKey: 'user1Id' })
  db.UserMatch.belongsTo(db.User, { foreignKey: 'user1Id' })
  db.User.hasMany(db.UserMatch, { foreignKey: 'user2Id' })
  db.UserMatch.belongsTo(db.User, { foreignKey: 'user2Id' })

  db.User.hasMany(db.VenueRequest, { foreignKey: 'userId'})
  db.VenueRequest.belongsTo(db.User, { foreignKey: 'userId'})

  db.User.hasMany(db.VenueUserHistory, { foreignKey: 'UserId'})
  db.VenueUserHistory.belongsTo(db.User, { foreignKey: 'UserId'})
  db.Venue.hasMany(db.VenueUserHistory, { foreignKey: 'VenueId'})
  db.VenueUserHistory.belongsTo(db.Venue, { foreignKey: 'VenueId'})

  db.User.hasMany(db.UserReport, { foreignKey: 'user1Id'});
  db.User.hasMany(db.UserReport, { foreignKey: 'user2Id'});
  db.UserReport.belongsTo(db.User, { foreignKey: 'user1Id' });
  db.UserReport.belongsTo(db.User, { foreignKey: 'user2Id' });

  db.User.hasMany(db.Conversation);
  db.Conversation.belongsTo(db.User, { as: 'user1' });
  db.Conversation.belongsTo(db.User, { as: 'user2' });
  db.Conversation.hasMany(db.Message);

  db.User.hasMany(db.Message, { foreignKey: 'sender' });
  db.User.hasMany(db.Message, { foreignKey: 'receiver' });
  db.Message.belongsTo(db.Conversation);
  db.Message.belongsTo(db.User, { foreignKey: 'receiver' });
  db.Message.belongsTo(db.User, { foreignKey: 'sender' });

  db.Venue.hasMany(db.Conversation, { foreignKey: 'venueId'})
  db.Conversation.belongsTo(db.Venue, { foreignKey: 'venueId'})

}, 2000)

db.sequelize = sequelize;
db.Sequelize = Sequelize;

global.db = db

module.exports = db;
