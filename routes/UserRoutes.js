const express = require("express");
const router = express.Router();
const authorization = require("../_helpers/authorization");
const upload = require("../middlewares/uploadMiddleware");
const UserService = require("../services/UserService")
const UserValidator = require("../validators/UserValidator");

router.get(
  "/me",
  authorization.allowIfVerified,
  UserService.serveLoggedInUserProfile
);

router.get(
  "/me/service-area",
  authorization.allowIfVerified,
  UserService.serveLoggedInUserProfile
);

router.get(
  "/me/change-location/service-areas",
  UserService.serveServiceAreas
);

router.post(
  "/me/search-city",
  authorization.allowIfOnBoarded,
  UserService.searchCityByServiceArea
);

router.post(
  "/me/change-location",
  authorization.allowIfOnBoarded,
  UserService.changeLocation
);

router.post(
  "/me/enable-location-updates",
  authorization.allowIfOnBoarded,
  UserService.enableLocationUpdates
);

router.post(
  "/me/mobile-token",
  authorization.allowIfOnBoarded,
  UserService.updateMobileToken
);

router.get(
  "/me/match/:matchType",
  authorization.allowIfOnBoarded,
  UserService.serveLoggedInUserMatches
);

router.get(
  "/me/pause",
  authorization.allowIfOnBoarded,
  UserService.pauseLoggedInUser
);

router.post(
  "/me",
  authorization.allowIfOnBoarded,
  upload.single('avatar'),
  UserService.editLoggedInUser
);

router.post(
  "/me/upload/:imageType/:index",
  authorization.allowIfOnBoarded,
  upload.single("image"),
  UserValidator.uploadImage,
  UserService.uploadImage
)

router.delete(
  "/me/image/:index",
  authorization.allowIfOnBoarded,
  UserService.deleteImage
)

router.delete("/me",
  authorization.allowIfOnBoarded,
  UserValidator.deleteLoggedInUser,
  UserService.deleteLoggedInUser
);

router.post(
  "/buy/premium/:subscriberPlanId",
  authorization.allowIfOnBoarded,
  UserService.buyPremium
);

router.post(
  "/buy/direct-message/:productId",
  authorization.allowIfOnBoarded,
  UserService.buyDirectMessage
);

router.get(
  "/:id/public-profile",
  UserService.serveUserPublicProfile
);

router.get(
  "/:id/is-online",
  UserService.checkIfUserIsOnline
);

router.get(
  "/:id/user-reports",
  UserService.serveUserReports
);

router.post(
  "/report",
  authorization.allowIfVerified,
  UserValidator.reportUser,
  UserService.reportUser
);

router.get(
  "/:id/block",
  authorization.allowIfVerified,
  UserService.blockUser
);

router.get(
  "/:id/un-match",
  authorization.allowIfVerified,
  UserService.unMatchUser
);

router.get(
  "/me/waves",
  authorization.allowIfVerified,
  UserService.serveWaves
);

router.get(
  "/me/swipe/revert-like/:matchId",
  authorization.allowIfVerified,
  UserService.revertLike
);

router.get(
  "/me/swipe/revert-pass/:matchId",
  authorization.allowIfVerified,
  UserService.revertPass
);

router.get(
  "/me/waves/count",
  authorization.allowIfVerified,
  UserService.serveWaveCount
);

router.get(
  "/me/messages/count",
  authorization.allowIfVerified,
  UserService.serveMessageCount
);

module.exports = router;
