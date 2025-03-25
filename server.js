const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cors = require('cors');

require("dotenv").config();

const app = express();
// mongodb+srv://unlock:<db_password>@unlockstartup.l2acc.mongodb.net/?retryWrites=true&w=majority&appName=UnlockStartup

const eventsRouter = require('./routers/events');
const pagesRouter = require('./routers/pages');
const pitchDeckRouter = require('./routers/pitch-deck');
const settingsRouter = require('./routers/settings');
const startupChallengesRouter = require('./routers/startup-challenges');
const transactionsRouter = require('./routers/transactions');
const usersRouter = require('./routers/users');
const normalusersRouter = require('./routers/normalusersRouter')
const enquiriesRouter = require('./routers/enquiry');
const categoriesRouter = require('./routers/categories');
const locationRouter = require('./routers/location');
const businessRouter = require('./routers/BusinessRoutes');
const priceRouter = require('./routers/Pricerouter');
const ChallengeRegistration = require('./routers/startupchallengeRegistration')
const eventsRegistrationRouter = require('./routers/eventRegistrartion')
const subscriptionRouter = require('./routers/subscription')
const { saveChallengesToDatabase } = require('./utils/DummyChallenges');
const { saveEventsToDatabase } = require("./utils/DummyEvent");
const saveData = require("./config/addlocation");
const stateRouter = require('./routers/staterouter')
const cityRouter = require('./routers/cityrouter')
// const Payment = require('./routers/payment')

const testroute = require('./routers/TestRoute')
const invoicerouter = require('./routers/genrateinvoice')

const Investor = require('./routers/investor')
const Investment = require('./routers/investment')

const subscriptionController = require('./controllers/subscription');





app.use(cookieParser());

// Configure CORS with specific options to fix API access issues
app.use(cors({
  origin: ['http://localhost:3000', 'https://unlockstartup.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// database connection
require("./config/db");

// Serve static files from public directory
// Both of these configurations are needed for compatibility with different URL formats
app.use('/uploads', express.static("public/uploads"));
app.use('/unlock/uploads', express.static("public/uploads"));

// routes
app.use('/unlock/api/startup-challenges', startupChallengesRouter)
app.use('/unlock/api/registration', ChallengeRegistration)
app.use('/unlock/api/pitch-deck', pitchDeckRouter)
app.use('/unlock/api/users', usersRouter)
app.use('/unlock/api/normaluser', normalusersRouter)
app.use('/unlock/api/events', eventsRouter)
app.use('/unlock/api/events-registration', eventsRegistrationRouter)
app.use('/unlock/api/subscription', subscriptionRouter)
app.use('/unlock/api/business', businessRouter)
app.use('/unlock/api/transactions', transactionsRouter)
app.use('/unlock/api/pages', pagesRouter)
app.use('/unlock/api/settings', settingsRouter)
app.use('/unlock/api/enquiries', enquiriesRouter)
app.use('/unlock/api/categories', categoriesRouter)
app.use('/unlock/api/states', stateRouter)
app.use('/unlock/api/citys', cityRouter)
app.use('/unlock/api/price', priceRouter)
app.use('/unlock/api/price', priceRouter)
// app.use('/unlock/api/payment', Payment)
app.use('/unlock/api/invoice', invoicerouter)
app.use('/unlock/api/test', testroute)
// app.use('/unlock/api/locations', locationRouter)
app.get('/unlock/ping', (req, res) => {
  res.send({
    message : 'Welcome to Unlock Startup API'
  });
})


// For Investers 

app.use('/unlock/api/investors', Investor)
app.use('/unlock/api/investment', Investment)

const port = process.env.PORT || 8002;

app.listen(port, () => {

  console.log(`Server started on ${port}`);
  console.log(process.env.key_id);
  
  // Initialize default subscription plans
  subscriptionController.initializeDefaultPlans();

  // Insert Dummy startup Challenges 
  //  saveChallengesToDatabase(5);

  // Insert Dummy startup Event 
  // saveEventsToDatabase(5);

  // saveData()    

});