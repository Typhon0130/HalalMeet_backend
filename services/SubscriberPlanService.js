const { SubscriberPlan } = require('../models')

const serveSubscriberPlans = async (req, res) => {
  try {
    const subscriberPlans = await SubscriberPlan.findAll()
    return res.status(200).json(subscriberPlans)
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(400).json({ backendI18nError: 'INTERNAL_SERVER_ERROR'});
  }
}


module.exports = {
  serveSubscriberPlans
}