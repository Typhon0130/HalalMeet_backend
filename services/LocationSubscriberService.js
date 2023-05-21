const { LocationSubscriber } = require('../models')

const serveLocationSubscriberOptions = async (req, res) => {
  try {
    await LocationSubscriber.create({
      email: req.body.email,
      country: req.body.country,
      region: req.body.region,
      city: req.body.city,
      location: { type: 'Point', coordinates: [req.body.lat, req.body.long]}
    })
    return res.status(200).json('SUBSCRIBED')
  } catch(error) {
    console.log(error)
    if (error.errors && error.errors[0]) return res.status(500).json(error.errors[0].message)
    return res.status(500).json('INTERNAL_SERVER_ERROR')
  }
}

module.exports = {
  serveLocationSubscriberOptions,
}