const simpleAuth = async (req, res, next) => {
    console.log('DOING: simpleAuth')
    if ((!req.body.email && !req.body.username) || !req.body.password) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API'})
    next()
}

const googleAuth = async (req, res, next) => {
    console.log('DOING: googleAuth')
    if (!req.body.token) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API'})
    next()
}

const facebookAuth = async (req, res, next) => {
    console.log('DOING: facebookAuth')
    if (!req.body.token) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API'})
    next()
}

const initAuthenticationProcess = async (req, res, next) => {
    console.log('DOING: initAuthenticationProcess')
    if (!req.body.phoneNumber) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API'})
    next()
}

const initAuthenticationProcessApple = async (req, res, next) => {
    console.log('DOING: initAuthenticationProcessApple')
    if (!req.body.email) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API'})
    next()
}

const verifyAuthenticationProcess = async (req, res, next) => {
    console.log('DOING: verifyAuthenticationProcess')
    if (!req.body.smsToken || !req.body.phoneNumber) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API'})
    next()
}

const onBoardUser = async (req, res, next) => {
    console.log('DOING: onBoardUser')
    console.log(req.body)
    if ((!req.file && !req.body.authImg) || !req.body.firstName || !req.body.lastName || !req.body.countries || !req.body.gender || !req.body.bornAt || !req.body.email) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API'})
    next()
}

const verifySelfie = async (req, res, next) => {
    console.log('DOING: verifySelfie')
    console.log(req.body)
    // if (!req.file) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API'})
    next()
}

const verifyLocation = async (req, res, next) => {
    console.log('DOING: verifyLocation')
    console.log(req.body)
    if (!req.body.lat || !req.body.long) return res.status(400).json({ backendI18nError: 'MISSING_DATA_FOR_API'})
    next()
}

module.exports = {
    simpleAuth,
    googleAuth,
    facebookAuth,
    initAuthenticationProcess,
    verifyAuthenticationProcess,
    onBoardUser,
    verifySelfie,
    verifyLocation,
    initAuthenticationProcessApple
}
