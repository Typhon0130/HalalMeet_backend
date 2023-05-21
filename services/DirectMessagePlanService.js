const db = require("../models");

const serveDirectMessagePlans = async (req, res) => {
  try {
    const directMessagePlans = await db.DirectMessagePlan.findAll()
    return res.status(200).json(directMessagePlans)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}

module.exports = {
  serveDirectMessagePlans
}