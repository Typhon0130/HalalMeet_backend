const AdminBro = require('admin-bro');
const SideBarGroups = require('../SideBarGroups')
const {isAdmin} = require("../util");
const bcrypt = require('bcrypt');
const {sendMessageToUser} = require("../../services/AuthService");
const { add3DMToUser, verifySelfie, rejectSelfie } = require("../../services/UserService");
const {removeUserData} = require("../../services/UserService");
const { ACTIONS } = require('admin-bro')
const { Model, Op } = require('sequelize');

module.exports = {
  parent: SideBarGroups.user,
  actions: {
    list: { isAccessible: isAdmin },
    bulkDelete: { isVisible: false },
    edit: { isAccessible: isAdmin, before: async (request) => {
        if(request.payload.password) {
          request.payload = {
            ...request.payload,
            encryptedPassword: await bcrypt.hash(request.payload.password, 10),
            password: null,
          }
        }
        return request
      },
    },
    banUser: {
      actionType: 'bulk',
      icon: 'view',
      isVisible: true,
      guard: 'Are you sure you want to ban these users?',
      handler: async (request, response, data) => {
        let ids =request.query.recordIds.split(',')
        await db.User.update(
          { state: 'BANNED' },
          {where: { id: { [Op.in]: ids } }}
        )
        ids.forEach(e => {
          sendMessageToUser(e, 'banned', {})
        })
        return {
          records: []
        }
      },
      component: false,
      isAccessible: isAdmin
    },
    togglePremium: {
      actionType: 'bulk',
      icon: 'view',
      isVisible: true,
      guard: 'Are you sure you want to toggle the premium feature for all these users?',
      handler: async (request, response, data) => {
        console.log('DELETING USER ', request)
        let users = await db.User.findAll({ where: { id: { [Op.in]: request.query.recordIds.split(',') } }})
        users.forEach(user => {
          if (user.role === 'USER') {
            user.role = 'PREMIUM_USER'
            var d = new Date();
            d.setMonth(d.getMonth() + 3);
            user.premiumUntil = d
            db.UserBadge.create({ userId: user.id, badge: 'VIP' })
            user.save()
          } else if (user.role === 'PREMIUM_USER') {
            user.role = 'USER'
            user.premiumUntil = null
            db.UserBadge.destroy({ where: { userId: user.id, badge: 'VIP' } })
            user.save()
          }
        })
        return {
          records: []
        }
      },
      component: false,
      isAccessible: isAdmin
    },
    add3DM: {
      actionType: 'bulk',
      isVisible: true,
      guard: 'Are you sure you want to 3 Direct Messages to these users?',
      handler: async (request, response, data) => {
        request.query.recordIds.split(',').forEach(e => {
          add3DMToUser(e)
        })
        return {
          records: []
        }
      },
      component: false,
      isAccessible: isAdmin
    },
    acceptSelfie: {
      actionType: 'bulk',
      isVisible: true,
      guard: 'Are you sure you want to Accept the Selfies of all these users?',
      handler: async (request, response, data) => {
        request.query.recordIds.split(',').forEach(e => {
          verifySelfie(e)
        })
        return {
          records: []
        }
      },
      component: false,
      isAccessible: isAdmin
    },
    rejectSelfie: {
      actionType: 'bulk',
      isVisible: true,
      guard: 'Are you sure you want to Reject the Selfies of all these users?',
      handler: async (request, response, data) => {
        request.query.recordIds.split(',').forEach(e => {
          rejectSelfie(e)
        })
        return {
          records: []
        }
      },
      component: false,
      isAccessible: isAdmin
    },
    removeUserAndAssociatedData: {
      actionType: 'bulk',
      icon: 'Delete',
      isVisible: true,
      guard: 'Are you sure you want to remove this user and all of its data PERMANENTLY?',
      handler: async (request, response, data) => {
        console.log('DELETING USER ', request)
        request.query.recordIds.split(',').forEach(e => {
          removeUserData(e)
        })
        return {
          records: []
        }
      },
      component: false,
      isAccessible: isAdmin
    },
    new: {
      before: async (request) => {
        console.log(request)
        if(request.payload.password) {
          request.payload = {
            ...request.payload,
            encryptedPassword: await bcrypt.hash(request.payload.password, 10),
            password: undefined
          }
        }
        return request
      },
      isAccessible: isAdmin
    },
    generateFakeUsers: {
      actionType: 'resource',
      icon: 'Bullhorn',
      name: 'Generate Fake Users',
      isVisible: true,
      component: AdminBro.bundle('../components/GenerateFakeUsers'),
      isAccessible: isAdmin
    },
    managerFakeUserMatches: {
      actionType: 'resource',
      icon: 'Bullhorn',
      name: 'Manage Fake User Matches',
      isVisible: true,
      component: AdminBro.bundle('../components/ManageFakeUserMatches'),
      isAccessible: isAdmin
    },
    sendNotification: {
      actionType: 'resource',
      icon: 'Bullhorn',
      name: 'Send Notification',
      isVisible: true,
      component: AdminBro.bundle('../components/NewNotifications'),
      isAccessible: isAdmin
    },
    // resetUserMatches: {
    //   actionType: 'resource',
    //   icon: 'Bullhorn',
    //   name: 'Reset User matches',
    //   isVisible: true,
    //   component: AdminBro.bundle('../components/ResetUserMatches'),
    //   isAccessible: isAdmin
    // },
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
    gender: {
      name: 'gender',
      label: 'Gender',
      availableValues: [
        {value: 'MALE', label: 'Male'},
        {value: 'FEMALE', label: 'Female'},
      ],
    },
    updatedAt: { components: { show: AdminBro.bundle('../components/userOtherData') } },
    venueId: { isVisible: { filter: false } },
    nrOfDirectMessages: { isVisible: { filter: false } },
    highlights: { isVisible: { edit: false, filter: false } },
    images: { isVisible: { edit: false, filter: false } },
    freezeLocation: { isVisible: { edit: false, filter: false } },
    mobileToken: { isVisible: { edit: false, list: false, filter: false, show: false } },
    lat: { isVisible: { edit: false, list: false, filter: false, show: true } },
    long: { isVisible: { edit: false, list: false, filter: false, show: true } },
    serviceArea: { isVisible: { edit: false } },
    smsTokenExpiresAt: { isVisible: { edit: false, list: false, filter: false, show: false } },
    smsToken: { isVisible: { edit: false, list: false, filter: false, show: false } },
    avatar: {
      components: {
        list: AdminBro.bundle('../components/displayAvatar'),
        edit: AdminBro.bundle('../components/editUserImg'),
        show: AdminBro.bundle('../components/displayAvatar')
      }
    },
    selfie: {
      isVisible: { edit: false },
      components: {
        list: AdminBro.bundle('../components/displaySelfie'),
        show: AdminBro.bundle('../components/displaySelfie')
      }
    }
  },
  filterProperties: ['id', 'iso', 'state', 'firstName', 'swipeIso', 'gender', 'bornAt', 'createdAt', 'ranOutOfSwipesAt', 'phoneNumber', 'swipesLeft', 'hasChildren', 'martialStatus', 'role', 'verificationStatus'],
  editProperties: ['phoneNumber', 'avatar', 'email', 'nrOfDirectMessages', 'swipesLeft', 'ranOutOfSwipesAt', 'height' ,'verificationStatus', 'martialStatus', 'hasChildren', 'lastName', 'firstName', 'occupation' ,'highestEducation', 'martialStatus', 'hasChildren', 'role' ,'state', 'verificationStatus', 'bornAt', 'gender' , 'premiumUntil', 'highlights', 'swipesLeft', 'password'],
  listProperties: ['id', 'avatar', 'selfie', 'lastName', 'firstName', 'role', 'email', 'verificationStatus', 'state', 'verificationStatus', 'premiumUntil', 'phoneNumber', 'bornAt']
};