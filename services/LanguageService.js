const db = require('../models')

const serveLanguageOptions = async (req, res) => {
  try {
    const languages = await db.Internalization.findAll({
      attributes: [
        [db.Sequelize.fn('DISTINCT', db.Sequelize.col('language')) ,'language']
      ]
    })
    if (!languages) return res.status(400).json({ backendI18nError: 'LANGUAGES_NOT_FOUND'});
    return res.status(200).json(languages)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const serveLanguageFile = async (req, res) => {
  try {
    let languageFile = await db.Internalization.findAll({ where: { language: req.params.language }, raw: true })
    if (!languageFile || languageFile.length === 0) {
      languageFile = await db.Internalization.findAll({ where: { language: 'English' }})
    }
    return res.status(200).json(languageFileToObject(languageFile))
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

const languageFileToObject = (array) =>
  array.reduce((obj, item) => {
    obj[item.i18nName] = item.name
    return obj
  }, {})

module.exports = {
  serveLanguageOptions,
  serveLanguageFile
}