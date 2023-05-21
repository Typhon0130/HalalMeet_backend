const createGooglePlaces = async (req, res, next) => {
  if (!req.body.lat || !req.body.long) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API' })
  next()
}

const createNewNotifications = async (req, res, next) => {
  if (!req.body.type || !req.body.serviceArea) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API' })
  next()
}

module.exports = {
  createGooglePlaces,
  createNewNotifications
}