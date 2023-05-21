const SideBarGroups = require('../SideBarGroups')
const AdminBro = require('admin-bro');
const {isAdmin} = require("../util");

module.exports = {
  parent: SideBarGroups.venue,
  properties: {
    types: {
      components: {
        list: AdminBro.bundle('../components/displayTypes'),
        view: AdminBro.bundle('../components/displayTypes'),
      }
    },
    img: {
      components: {
        list: AdminBro.bundle('../components/displayImg'),
        view: AdminBro.bundle('../components/displayImg'),
      }
    }
  },
  actions: {
    pagination: {
      actionType: 'resource',
      icon: 'Bullhorn',
      name: 'Set Rows per page',
      isVisible: true,
      component: AdminBro.bundle('../components/SetRowsPerPage'),
      isAccessible: isAdmin
    },
    new: {
      actionType: 'resource',
      icon: 'CategoryNew',
      name: 'Query new Places from Google',
      isVisible: true,
      component: AdminBro.bundle('../components/NewGooglePlaces'),
      isAccessible: isAdmin
    },
    list: { isAccessible: isAdmin },
    edit: { isAccessible: isAdmin },
    delete: { isAccessible: isAdmin },
    createVenue: {
      actionType: 'resource',
      icon: 'Building',
      name: 'Create New Google Place',
      isVisible: true,
      component: AdminBro.bundle('../components/NewGooglePlace'),
      isAccessible: isAdmin
    },
    createVenues: {
      actionType: 'resource',
      icon: 'Building',
      name: 'Transform Google Places to Venues',
      isVisible: true,
      component: AdminBro.bundle('../components/CreateNewVenuesFromGooglePlaces'),
      isAccessible: isAdmin
    },
  },
  listProperties: ['id', 'img', 'name', 'vicinity', 'city', 'country', 'rating', 'createdAt']
};