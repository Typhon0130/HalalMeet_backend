const express = require("express");
const router = express.Router();
const VenueService = require("../services/VenueService")
const VenueValidator = require("../validators/VenueValidator")
const authorization = require("../_helpers/authorization");

router.get(
    "/",
    authorization.allowIfOnBoarded,
    VenueValidator.serveVenues,
    VenueService.serveVenues
);

router.get(
  "/featured",
  authorization.allowIfOnBoarded,
  VenueValidator.serveVenues,
  VenueService.serveFeaturedVenues
);

router.get(
  "/users",
  authorization.allowIfOnBoarded,
  VenueService.serveVenueUsers
);

router.get(
  "/history",
  authorization.allowIfOnBoarded,
  VenueService.serveVenueHistory
);

router.get(
  "/history/users",
  authorization.allowIfOnBoarded,
  VenueService.serveVenueHistoryUsers
);

router.get(
  "/join/:id",
  authorization.allowIfOnBoarded,
  VenueService.joinVenue
);

router.get(
  "/leave/:id",
  authorization.allowIfOnBoarded,
  VenueService.leaveVenue
);

router.post(
  "/recommend-venue",
  authorization.allowIfOnBoarded,
  VenueValidator.recommendVenue,
  VenueService.recommendVenue
);

module.exports = router;
