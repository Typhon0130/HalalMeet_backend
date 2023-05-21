const AdminBro = require('admin-bro')
const SideBarGroups = require('../SideBarGroups');
const {isAdmin} = require("../util");

module.exports = {
  parent: SideBarGroups.user,
  actions: {
    list: { isAccessible: isAdmin },
    edit: { isAccessible: isAdmin },
    delete: { isAccessible: isAdmin },
    new: { isAccessible: isAdmin },
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
    type: {
      components: {
        list: AdminBro.bundle('../components/displayMatchType'),
        view: AdminBro.bundle('../components/displayMatchType'),
      }
    },
  },
  listProperties: ['id', 'type', 'user1Id', 'user1Response', 'user2Id', "user2Response", 'createdAt', 'venueId', 'employeeId']
};