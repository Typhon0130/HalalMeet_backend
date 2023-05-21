const AdminBro = require('admin-bro')
const SideBarGroups = require('../SideBarGroups');
const {isAdmin} = require("../util");
const axios = require('axios')
const db = require('../../models')

module.exports = {
  parent: SideBarGroups.venue,
  actions: {
    list: { isAccessible: isAdmin },
    delete: { isAccessible: isAdmin },
    new: { isAccessible: isAdmin },
    toggleFeatured: {
      actionType: 'bulk',
      icon: 'View',
      isVisible: true,
      handler: async (request, response, data) => {
        let ids = request.query.recordIds.split(',')
        let venues = await db.Venue.findAll({where: { id: ids}})
        venues.forEach(e => {
          e.featured = !e.featured
          e.save()
        })
        return {
          records: venues
        }
      },
      component: false,
      isAccessible: isAdmin
    },
    toggleAutoNotificaitons: {
      actionType: 'bulk',
      icon: 'View',
      isVisible: true,
      handler: async (request, response, data) => {
        let ids = request.query.recordIds.split(',')
        let venues = await db.Venue.findAll({where: { id: ids}})
        venues.forEach(e => {
          e.allowAutoNotifications = !e.allowAutoNotifications
          e.save()
        })
        return {
          records: venues
        }
      },
      component: false,
      isAccessible: isAdmin
    },
    pagination: {
      actionType: 'resource',
      icon: 'Bullhorn',
      name: 'Set Rows per page',
      isVisible: true,
      component: AdminBro.bundle('../components/SetRowsPerPage'),
      isAccessible: isAdmin
    },
  },
  properties: {
    img: {
      components: {
        list: AdminBro.bundle('../components/displayImg'),
        edit: AdminBro.bundle('../components/editImg'),
        view: AdminBro.bundle('../components/displayImg'),
      }
    },
    // updatedAt: {
    //   isVisible: { edit: false, filter: false },
    //   components: {
    //     list: AdminBro.bundle('../components/displayVenueStatistics'),
    //     show: AdminBro.bundle('../components/displayVenueStatistics')
    //   }
    // },
    // location: {
    //   components: {
    //     list: AdminBro.bundle('../components/displayLocation'),
    //     show: AdminBro.bundle('../components/displayLocation')
    //   }
    // }
  },
  listProperties: ['id', 'img', 'name', 'featured', 'allowAutoNotifications', 'vicinity', 'city', 'country', 'updatedAt', 'createdAt']
};