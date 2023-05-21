const { validationResult } = require('express-validator/check');

exports.validate = checks => [
  ...checks,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(422).json({ errors: errors.array() }) }
    next();
  },
];
