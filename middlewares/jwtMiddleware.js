const jwt = require('jsonwebtoken');

const jwtMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization) {
    const accessToken = authorization.split(" ")[1];
    let token;
    try {
      // token = true;
      token = await jwt.verify(accessToken, process.env.JWT_SECRET);

    } catch (e) {
      if (e.name === 'TokenExpiredError') { return await res.json(401, 'JWT_EXPIRED') }
    }
    if (!token) { return await res.status(401).json('INVALID_TOKEN') }
    res.locals.user = {
      ...token
    }
    next();
  }else{
    next();
  }
  // if (req.headers["authorization"]) {
  //   const accessToken = req.headers["authorization"];
  //   console.log('############## ',accessToken)
  //   let token;
  //   try {
  //     // token = true;
  //     token = await jwt.verify(accessToken, process.env.JWT_SECRET);
  //
  //   } catch (e) {
  //     if (e.name === 'TokenExpiredError') { return await res.json(401, 'JWT_EXPIRED') }
  //   }
  //   if (!token) { return await res.status(401).json('INVALID_TOKEN') }
  //   res.locals.user = {
  //     ...token
  //   }
  //   next();
  // } else {
  //   next();
  // }
}

module.exports = jwtMiddleware
