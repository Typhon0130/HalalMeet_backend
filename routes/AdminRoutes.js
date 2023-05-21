const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const router = express.Router();
const AdminService = require("../services/AdminService")
const AuthService = require("../services/AuthService")
const AdminValidator = require("../validators/AdminValidator")
const authorization = require("../_helpers/authorization");
const VenueService = require("../services/VenueService");

router.post(
  "/create-google-places",
  AdminValidator.createGooglePlaces,
  AdminService.createGooglePlaces
);

router.post(
  "/create-google-place",
  upload.single('img'),
  AdminService.createNewGooglePlace
);

router.post(
  "/create-new-notifications",
  AdminValidator.createNewNotifications,
  AuthService.createNewNotifications
);

router.get(
  "/google-places-to-venues",
  AdminService.googlePlacesToVenues
);

router.get(
  "/language-file-properties",
  AdminService.languageFileProperties
);

router.post(
  "/new-language-file",
  AdminService.newLanguageFile
);

router.post(
  "/generate-fake-users",
  AdminService.generateFakeUsers
);

router.get(
  "/serve-fake-user-matches",
  AdminService.serveFakeUserMatches
);

router.get(
  "/serve-employees",
  AdminService.serveEmployees
);

router.post(
  "/assign-to-employee",
  AdminService.assignToEmployee
);

router.get(
  "/accept-fake-match/:matchId",
  AdminService.acceptMatch
);

router.get(
  "/decline-fake-match/:matchId",
  AdminService.declineMatch
);

router.get(
  "/generate-token-for-employee/:employeeId",
  AdminService.generateTokenForEmployee
);

router.get(
  "/serve-cities",
  AdminService.serveCityOptions
);
router.get(
  "/serve-custom-templates",
  AdminService.serveCustomTemplates
);

router.get(
  "/refresh-html-files",
  AdminService.refreshHtmlFiles
);


router.get(
  "/reset-user-matches",
  AdminService.resetUserMatches
);

router.get(
  "/venue-statistic/:venueId",
  AdminService.getVenueStatistics
);

router.get(
  "/make-featured/",
  AdminService.makeVenuesFeatured
);

router.post(
  "/venue/:id/change-image",
  upload.single('img'),
  AdminService.changeVenueImage
);

router.post(
  "/user/:id/change-image",
  upload.single('img'),
  AdminService.changeUserImage
);

module.exports = router;