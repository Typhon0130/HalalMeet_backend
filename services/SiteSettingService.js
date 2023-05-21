const { SiteSettings } = require('../models')

const serveSiteSettings = async (req, res) => {
  try {
    const siteSetting = await SiteSettings.findLatestEnabledOrDefault()
    if (!siteSetting) return res.status(400).json({ backendI18nError: 'SITE_SETTING_NOT_FOUND'});
    return res.status(200).json(siteSetting)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}


module.exports = {
  serveSiteSettings
}