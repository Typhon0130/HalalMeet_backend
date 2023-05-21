const AdminBro = require('admin-bro')
const SideBarGroups = require('../SideBarGroups');
const {isAdmin} = require("../util");

module.exports = {
  parent: SideBarGroups.chat,
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
    updatedAt: { isVisible: { edit: false, filter: false, new: false } },
    senderInfo: { isVisible: { edit: false, filter: false, new: false, list: false } },
  },
  listProperties: ['id', 'sender', 'receiver', 'text', 'ConversationId', 'seen', 'isDirectMessage', 'createdAt']
};