const express = require("express");
const router = express.Router();
const DirectMessagePlanService = require("../services/DirectMessagePlanService")

router.get(
  "/",
  DirectMessagePlanService.serveDirectMessagePlans
);

module.exports = router;
