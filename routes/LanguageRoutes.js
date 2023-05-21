const express = require("express");
const router = express.Router();
const LanguageService = require("../services/LanguageService")
const LanguageValidator = require("../validators/LanguageValidator")

router.get(
  "/",
  LanguageService.serveLanguageOptions
);

router.get(
  "/:language",
  LanguageValidator.serveLanguageFile,
  LanguageService.serveLanguageFile
);

module.exports = router;
