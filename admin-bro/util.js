const bcrypt = require('bcrypt');
const db = require('../models');
const { Model, Op } = require('sequelize');
const AdminBro = require('admin-bro')

async function authenticate(email, password) {
  try {
    const userRecord = await db.User.findOne({
      where: {
        email: email,
        role: { [Op.or]: ['ADMIN', 'EMPLOYEE'] }
      }
    });
    if (userRecord) {
      const matched = await bcrypt.compare(password, userRecord.encryptedPassword);
      if (matched) {
        return userRecord;
      }
    }
    return false;
  } catch (e) {
    console.log('ERROR IN AUTH: ', e)
  }
}

const isAdmin = ({ currentAdmin }) => {
  return currentAdmin && currentAdmin.role === 'ADMIN'
}

const addRequiredAdminToAll = () => {
  return {
      list: { isAccessible: isAdmin },
      edit: { isAccessible: isAdmin },
      delete: { isAccessible: isAdmin },
      new: { isAccessible: isAdmin },
      pagination: {
        actionType: 'resource',
        icon: 'Bullhorn',
        name: 'Set Rows per page',
        isVisible: true,
        component: AdminBro.bundle('./components/SetRowsPerPage'),
        isAccessible: isAdmin
      },
    }
}

module.exports = {
  authenticate,
  isAdmin,
  addRequiredAdminToAll
};