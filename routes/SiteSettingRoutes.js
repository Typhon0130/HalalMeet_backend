const express = require("express");
const router = express.Router();
const SiteSettingService = require("../services/SiteSettingService")

router.get(
  "/",
  SiteSettingService.serveSiteSettings
);

module.exports = router;
