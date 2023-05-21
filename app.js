
require('dotenv').config();
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
const multer = require('multer');
const express = require("express");
const bodyParser = require("body-parser");
const AdminBro = require('admin-bro')
const AdminBroExpress = require('admin-bro-expressjs');
const AdminBroSequelize = require('admin-bro-sequelizejs');
AdminBro.registerAdapter(AdminBroSequelize);
const adminBro = require('./admin-bro');
const { authenticate } = require('./admin-bro/util');
const PORT = 3030;
const app = express();
const path = require('path');
let router = express.Router()

AdminBroExpress.buildAuthenticatedRouter(adminBro, {
  authenticate,
  cookieName: 'adminbro',
  cookiePassword: 'snomePassword',
}, router)

app.use(adminBro.options.rootPath, router);
app.use(adminBro.options.loginPath, router);

app.use(require("cors")());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(require("./middlewares/jwtMiddleware"));
app.use(require("morgan")("tiny"));

app.use(express.static('static-page'))

const server = app.listen(PORT, () => { console.log("Server is listening on Port:", PORT); });
const io = require('socket.io')(server);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/privacy-policy', function(req, res) {
  res.sendFile(path.join(__dirname + '/static-page/privacyPolicy.html'));
});

app.get('/terms-and-conditions', function(req, res) {
  res.sendFile(path.join(__dirname + '/static-page/termsAndConditions.html'));
});

app.use("/api/auth/", require("./routes/AuthRoutes"));
app.use("/api/user/", require("./routes/UserRoutes"));
app.use("/api/language/", require("./routes/LanguageRoutes"));
app.use("/api/ice-breaker/", require("./routes/IceBreakerRoutes"));
app.use("/api/interest/", require("./routes/InterestRoutes"));
app.use("/api/location-subscriber/", require("./routes/LocationSubscriberRoutes"));
app.use("/api/site-settings/", require("./routes/SiteSettingRoutes"));
app.use("/api/subscriber-plans/", require("./routes/SubscriberPlanRoutes"));
app.use("/api/direct-message/", require("./routes/DirectMessageRoutes"));
app.use("/api/venue/", require("./routes/VenueRoutes"));
app.use("/api/admin/", require("./routes/AdminRoutes"));
app.use("/api/file/", require("./routes/FileRoutes"));
app.use("/api/db/", require("./routes/DbResetRoutes"));

require('./sockets/socketio').initialize(io)
require('./scheduledJobs')()

app.use(() => (err, req, res, next) => {
  console.log('ERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR   ', err)
  if (err instanceof multer.MulterError) {
    return res.status(418).send(err.code);
  }
});
