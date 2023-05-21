const AdminBro = require('admin-bro')
const SideBarGroups = require('../SideBarGroups');
const {isAdmin} = require("../util");

module.exports = {
  parent: SideBarGroups.venue,
  actions: {
    list: { isAccessible: isAdmin },
    edit: { isAccessible: isAdmin },
    delete: { isAccessible: isAdmin },
    new: { isVisible: false },
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
    updatedAt: { isVisible: {  filter: false, edit: false, list: false } },
    location: { isVisible: {  filter: false, edit: false, list: false } },
  },
  listProperties: ['placeName', 'lat', 'long', 'userId', 'createdAt']
};