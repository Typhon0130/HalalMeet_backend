const SideBarGroups = require('../SideBarGroups')
const AdminBro = require('admin-bro');
const {isAdmin} = require("../util");

module.exports = {
  parent: SideBarGroups.app,
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
    privacyPolicy: { type: 'richtext' },
    termsAndConditions: { type: 'richtext' },
  }
};