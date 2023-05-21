const AdminBro = require('admin-bro');
const db = require('../models');
const SideBarGroups = require('./SideBarGroups')
const resources = require('./resources')
const {addRequiredAdminToAll} = require("./util");

const adminBro = new AdminBro({
  rootPath: '/admin',
  loginPath: '/admin/login',
  dashboard: {
    component: AdminBro.bundle('./components/dashboard')
  },
  branding: {
    companyName: 'Halal-Meet Admin Panel',
    softwareBrothers: false,
  },
  pages: {
    EmployeeChat: {
      label: 'Employee chat',
      component: AdminBro.bundle('./components/employeeChat'),
      parent: SideBarGroups.user
    }
  },
  env: {
    BASE_URL: process.env.NODE_ENV === 'production' ? 'https://halalmeet.ca/admin' : 'http://localhost:3030/admin',
    API_URL: process.env.NODE_ENV === 'production' ? 'https://halalmeet.ca/api' : 'http://localhost:3030/api',
    SOCKET_URL: process.env.NODE_ENV === 'production' ? 'https://halalmeet.ca' : 'http://localhost:3030',
  },
  resources: [
    { resource: db.User, options: resources.UserResource },
    { resource: db.UserBlock, options: { parent: SideBarGroups.user, actions: addRequiredAdminToAll() } },
    { resource: db.UserCountry, options: { parent: SideBarGroups.user, actions: addRequiredAdminToAll() } },
    { resource: db.UserMatch, options: resources.UserMatchResource },
    { resource: db.UserLanguage, options: { parent: SideBarGroups.user, actions: addRequiredAdminToAll() } },
    { resource: db.UserInterest, options: { parent: SideBarGroups.user, actions: addRequiredAdminToAll() } },
    { resource: db.UserBadge, options: { parent: SideBarGroups.user, actions: addRequiredAdminToAll() } },
    { resource: db.DeletionReason, options: resources.DeletionReasonResource },

    { resource: db.Conversation, options: { parent: SideBarGroups.chat, actions: addRequiredAdminToAll() } },
    { resource: db.Message, options: resources.MessageResource },

    { resource: db.Venue, options: resources.VenueResource },
    { resource: db.VenueUserHistory, options: { parent: SideBarGroups.venue, actions: addRequiredAdminToAll() } },
    { resource: db.GooglePlaces, options: resources.GooglePlacesResource },
    { resource: db.VenueRequest, options: resources.VenueRequestResource },

    { resource: db.ServiceArea, options: { parent: SideBarGroups.app, actions: addRequiredAdminToAll() } },
    { resource: db.Internalization, options: resources.InternalizationResource },
    { resource: db.SiteSettings, options: resources.SiteSettingResource },

    { resource: db.Event, options: resources.EventResource },
    { resource: db.IceBreaker, options: { parent: SideBarGroups.app, actions: addRequiredAdminToAll() } },
    { resource: db.Interest, options: resources.InterestResource },
    { resource: db.LocationSubscriber, options: { parent: SideBarGroups.app, actions: addRequiredAdminToAll() } },
    { resource: db.SubscriberPlan, options: { parent: SideBarGroups.app, actions: addRequiredAdminToAll() } },
    { resource: db.DirectMessagePlan, options: { parent: SideBarGroups.app, actions: addRequiredAdminToAll() } },
    { resource: db.Payment, options: { parent: SideBarGroups.app, actions: addRequiredAdminToAll() } },
    { resource: db.UserReport, options: { parent: SideBarGroups.user, actions: addRequiredAdminToAll() } },
  ],
  locale: {
    translations: {
      labels: {
        UserMatches: 'User Interactions',
        LocationSubscribers: 'Coming Soon Subscribers',
        loginWelcome: 'Welcome to Halal Meet Admin'
      },
      messages: {
        loginWelcome: ''
      }
    }
  }
});
module.exports = adminBro;