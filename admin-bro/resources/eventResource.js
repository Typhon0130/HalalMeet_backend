const AdminBro = require('admin-bro');
const SideBarGroups = require('../SideBarGroups')
const {isAdmin} = require("../util");

module.exports = {
  parent: SideBarGroups.app,
  actions: {
    new: {
      isAccessible: isAdmin
    },
    refresh: {
      actionType: 'resource',
      icon: 'Book',
      name: 'Refresh Templates',
      isVisible: true,
      component: AdminBro.bundle('../components/RefreshHtmlFiles'),
      isAccessible: isAdmin
    },
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
  listProperties: ['templateName', 'eventName']
};