const express = require("express");
const router = express.Router();
const SubscriberPlanService = require("../services/SubscriberPlanService")

router.get(
  "/",
  SubscriberPlanService.serveSubscriberPlans
);

module.exports = router;
