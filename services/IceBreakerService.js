const { IceBreaker } = require('../models')

const serveIceBreakers = async (req, res) => {
  try {
    const iceBreakers = await IceBreaker.findAll({ where: { language: req.params.language } })
    if (!iceBreakers) return res.status(400).json({ backendI18nError: 'ICE_BREAKER_NOT_FOUND'});
    return res.status(200).json(iceBreakers)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'})
  }
}

module.exports = {
  serveIceBreakers
}