const serveLocationSubscriberOptions = async (req, res, next) => {
  if (!req.body.email) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API' })
  next()
}

module.exports = {
  serveLocationSubscriberOptions
}