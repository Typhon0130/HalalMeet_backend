const editUser = async (req, res, next) => {
  console.log('DOING:  editUser')
  if (!req.body.lastName || !req.body.firstName || !req.body.email) return res.status(400).json({backendI18nError: 'MISSING_DATA_FOR_API'})
  next()
}

const uploadImage = async (req, res, next) => {
  console.log('DOING:  uploadImage')
  if (!req.file) return res.status(400).json({backendI18nError: 'MISSING_DATA_FOR_API'})
  next()
}

const deleteLoggedInUser = async (req, res, next) => {
  console.log('DOING:  deleteLoggedInUser')
  if (!req.body.reason) return res.status(400).json({backendI18nError: 'MISSING_DATA_FOR_API'})
  next()
}

const reportUser = async (req, res, next) => {
  console.log('DOING:  reportUser')
  if (!req.body.reason || req.body.blockUser === null || !req.body.reportedUserId) return res.status(400).json({backendI18nError: 'MISSING_DATA_FOR_API'})
  next()
}

const blockUser = async (req, res, next) => {
  console.log('DOING:  blockUser')
  if (!req.body.blockedUserId) return res.status(400).json({backendI18nError: 'MISSING_DATA_FOR_API'})
  next()
}

module.exports = {
  editUser,
  uploadImage,
  deleteLoggedInUser,
  reportUser,
  blockUser
}