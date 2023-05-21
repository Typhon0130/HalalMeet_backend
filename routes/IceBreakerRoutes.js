const express = require("express");
const router = express.Router();
const IceBreakerService = require("../services/IceBreakerService")

router.get(
  "/:language",
  IceBreakerService.serveIceBreakers
);

module.exports = router;
