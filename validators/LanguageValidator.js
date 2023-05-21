const serveLanguageFile = async (req, res, next) => {
  if (!req.params.language) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API' })
  next()
}

module.exports = {
  serveLanguageFile
}