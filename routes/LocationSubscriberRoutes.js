const express = require("express");
const router = express.Router();
const LocationSubscriberService = require("../services/LocationSubscriberService")
const LocationSubscriberValidator = require("../validators/LocationSubscriberValidator")

router.post(
  "/subscribe",
  LocationSubscriberValidator.serveLocationSubscriberOptions,
  LocationSubscriberService.serveLocationSubscriberOptions
);

module.exports = router;
