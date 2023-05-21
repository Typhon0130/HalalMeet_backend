const serveVenues = async (req, res, next) => {
  if (!req.query.lat || !req.query.long) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API' })
  next()
}

const recommendVenue = async (req, res, next) => {
  if (!req.query.lat || !req.query.long || !req.body.placeName) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API' })
  next()
}

module.exports = {
  serveVenues,
  recommendVenue
}