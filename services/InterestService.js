const { Interest } = require('../models')

const serveInterests = async (req, res) => {
  try {
    const interests = await Interest.findAll({ limit: 10, order: [['updatedAt', 'DESC']] })
    if (!interests) return res.status(400).json({ backendI18nError: 'ICE_BREAKER_NOT_FOUND'});
    return res.status(200).json(interests)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'})
  }
}

module.exports = {
  serveInterests
}