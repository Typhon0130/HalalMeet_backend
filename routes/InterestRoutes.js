const express = require("express");
const router = express.Router();
const InterestService = require("../services/InterestService")

router.get(
  "/",
  InterestService.serveInterests
);

module.exports = router;
