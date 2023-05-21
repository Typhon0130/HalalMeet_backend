exports.allowIfOnBoarded = async (req, res, next) => {
  if (!res.locals.user) { return res.status(401).json('NOT_LOGGED_IN') }
  if (res.locals.user.state !== 'ON_BOARDED') { return res.status(400).json({ backendI18nError: 'NOT_ON_BOARDED'}) }
  next();
}

exports.allowIfAdmin = async (req, res, next) => {
  if (!res.locals.user) { return res.status(401).json('NOT_LOGGED_IN') }
  if (res.locals.user.role !== 'ADMIN') { return res.status(400).json({ backendI18nError: 'MISSING_PERMISSIONS'}) }
  next();
}

exports.allowIfPremium = async (req, res, next) => {
  if (!res.locals.user) { return res.status(401).json('NOT_LOGGED_IN') }
  if (res.locals.user.role !== 'PREMIUM_USER') { return res.status(400).json({ backendI18nError: 'MISSING_PERMISSIONS'}) }
  next();
}

exports.allowIfVerified = async (req, res, next) => {
  if (!res.locals.user) { return res.status(401).json('NOT_LOGGED_IN') }
  if (res.locals.user.state !== 'VERIFIED' && res.locals.user.state !== 'ON_BOARDED') { return res.status(400).json({ backendI18nError: 'NOT_VERIFIED'}) }
  next();
}