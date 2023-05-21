
const express = require('express');
const router = express.Router();
const AuthService = require("../services/AuthService")
const AuthValidator = require("../validators/AuthValidator")
const authorization = require("../_helpers/authorization");
const upload = require("../middlewares/uploadMiddleware");

router.post(
  '/init',
  AuthValidator.initAuthenticationProcess,
  AuthService.initAuthenticationProcess
);

router.post(
    '/init/apple',
    AuthValidator.initAuthenticationProcessApple,
    AuthService.initAuthenticationProcessApple
);

router.get(
  '/validate-oauth-email/:email',
  AuthService.validateOauthEmail
);

router.get(
  '/email/:email',
  AuthService.checkEmailUnique
);

router.post(
  '/verify',
  AuthValidator.verifyAuthenticationProcess,
  AuthService.verifyAuthenticationProcess
);

router.post(
  '/onboard',
  authorization.allowIfVerified,
  upload.array('image'),
  AuthValidator.onBoardUser,
  AuthService.onBoardUser
);

router.post(
  '/verify-selfie',
  upload.single('avatar'),
  AuthValidator.verifySelfie,
  AuthService.verifySelfie
);

router.post('/verify-location',
  AuthValidator.verifyLocation,
  AuthService.verifyLocation
);

module.exports = router
