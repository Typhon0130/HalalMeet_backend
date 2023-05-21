const AdminBro = require('admin-bro');
const SideBarGroups = require('../SideBarGroups')
const {isAdmin} = require("../util");

module.exports = {
  parent: SideBarGroups.user,
  actions: {
    new: { isAccessible: isAdmin },
    list: { isAccessible: isAdmin },
    edit: { isAccessible: isAdmin },
    delete: { isAccessible: isAdmin },
    pagination: {
      actionType: 'resource',
      icon: 'Bullhorn',
      name: 'Set Rows per page',
      isVisible: true,
      component: AdminBro.bundle('../components/SetRowsPerPage'),
      isAccessible: isAdmin
    },
  },
  listProperties: ['id', 'reason', 'firstName', 'lastName', 'email', 'phoneNumber', 'city', 'country', 'createdAt']
};