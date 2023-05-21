const AdminBro = require('admin-bro');
const SideBarGroups = require('../SideBarGroups')
const {isAdmin} = require("../util");

module.exports = {
  parent: SideBarGroups.app,
  actions: {
    newBulk: {
      actionType: 'resource',
      icon: 'Book',
      name: 'Add New Language File',
      isVisible: true,
      component: AdminBro.bundle('../components/NewLanguageFile'),
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
  listProperties: ['id', 'language', 'i18nName', 'name', 'createdAt']
};