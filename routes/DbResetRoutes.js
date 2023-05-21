const express = require('express');
const router = express.Router();
const db = require('../models')
const faker = require('faker');
const bcrypt = require('bcrypt');

const booleans = [true, false]
const roles = ['USER', 'ADMIN', 'PREMIUM_USER', 'EMPLOYEE', 'FAKE_USER']
const states = ['ON_BOARDED', 'ON_BOARDED', 'ON_BOARDED', 'BANNED']
const genders = ['MALE', 'FEMALE']
const badges = ['RESPONSIVE', 'VIP', 'POPULAR', 'ACTIVE']
const countries = ['hu', 'ca', 'es', 'cn', 'tw']
const interests = [{icon: 'people-carry', i18nName: 'VIEW_LIKE_YOU'}, {icon: 'swimming-pool', i18nName: 'FILTERED_SEARCH'}, {
  icon: 'cat',
  i18nName: 'LEFT'
}, {icon: 'utensils', i18nName: 'BLOCK'}, {icon: 'user', i18nName: 'REPORT'}]
const isos = ['Hungarian', 'English']
const heights = [170, 189, 153, 177, 191]
const dates = ['1985-01-01', '1985-01-01', '1990-01-01', '1991-01-01', '1995-01-01', '2000-01-01', '2002-01-01']
const icons = ['user', 'address-book', 'android', 'angry', 'bomb', 'bone']
const i18nArray = require('./db/i18n')
const guys = ['guy1.jpg', 'guy2.jpg', 'guy4.jpg']
const girls = ['girl1.jpg', 'girl2.jpg', 'girl3.jpg', 'girl4.jpg', 'girl5.jpg']

// router.get('/reset',
//   async function (req, res) {
//     try {
//       //
//       // let eng = await db.Internalization.findAll({ where: { language: 'English' } })
//       // let turk = await db.Internalization.findAll({ where: { language: 'Türkçe' } })
//       // let arab = await db.Internalization.findAll({ where: { language: 'العربية' } })
//       // let missingTurk = []
//       // let missingArab = []
//       // eng.forEach(e => {
//       //   let turkFound = turk.find(e2 => e2.id === e.id)
//       //   if (!turkFound) {
//       //     missingTurk.push({ i18nName: e.i18nName, name: e.name })
//       //   }
//       //   let arabFound = arab.find(e2 => e2.id === e.id)
//       //   if (!arabFound) {
//       //     missingArab.push({ i18nName: e.i18nName, name: e.name })
//       //   }
//       // })
//       // return res.status(200).json({
//       //   turk: missingTurk,
//       //   arab: missingArab,
//       //   engLength: eng.length,
//       //   arabLength: arab.length,
//       //   turkLength: turk.length,
//       // })
//
//
//       // // await db.sequelize.sync({ force: true })
//       // await db.User.sync({force: true})
//       // await db.Conversation.sync({force: true})
//       // await db.VenueUserHistory.sync({force: true})
//       // await db.VenueRequest.sync({force: true})
//       // // await db.Venue.sync({force: true})
//       // await db.GooglePlaces.sync({force: true})
//       // await db.UserLanguage.sync({force: true})
//       // await db.UserInterest.sync({force: true})
//       // await db.Event.sync({force: true})
//       // await db.Interest.sync({force: true})
//       // await db.UserBadge.sync({force: true})
//       // await db.UserCountry.sync({force: true})
//       // await db.UserBlock.sync({force: true})
//       // await db.Conversation.sync({force: true})
//       // await db.UserMatch.sync({force: true})
//       // await db.SubscriberPlan.sync({force: true})
//       // await db.SiteSettings.sync({force: true})
//       // await db.UserReport.sync({force: true})
//       // await db.ServiceArea.sync({force: true})
//       // await db.Payment.sync({force: true})
//       // await db.Message.sync({force: true})
//       // await db.Event.sync({force: true})
//       // await db.LocationSubscriber.sync({force: true})
//       // await db.Internalization.sync({force: true})
//       // await db.IceBreaker.sync({force: true})
//       // await db.DeletionReason.sync({force: true})
//       // await db.DirectMessagePlan.sync({force: true})
//       // await generateInterests(10)
//       // await generateAdmin()
//       // await generateEvents()
//       // await generateIceBreakers(20)
//       // await generateServiceAreas()
//       // await generateInternalizations()
//       // await generateSiteSettings()
//       // await generateSubscriberPlans()
//       // await generateDirectMessagePlans()
//       // return res.status(200).json('DATA LOADED')
//     } catch (e) {
//       console.log(e)
//       return res.status(400).json({backendI18nError: 'FAILED'})
//     }
//   }
// );

async function generateUsers(number) {
  const loop = [...Array(number)]
  for (const index of loop) {
    const gender = faker.random.arrayElement(['FEMALE', 'FEMALE', 'FEMALE', 'FEMALE', 'MALE']);
    const firstName = faker.name.firstName(gender);
    const lastName = faker.name.lastName(gender);
    const role = faker.random.arrayElement(roles);
    const iso = faker.random.arrayElement(['hu', 'ca'])
    await db.User.create({
      phoneNumber: faker.phone.phoneNumber(),
      email: faker.internet.email(),
      smsToken: faker.random.number(),
      serviceArea: 1,
      city: iso === 'hu' ? 'Budapest' : 'Toronto',
      region: iso === 'hu' ? 'Budapest' : 'Ontario',
      country: iso === 'hu' ? 'Hungary' : 'Canada',
      iso: iso,
      swipeCity: iso === 'hu' ? 'Budapest' : 'Toronto',
      swipeRegion: iso === 'hu' ? 'Budapest' : 'Ontario',
      swipeCountry: iso === 'hu' ? 'Budapest' : 'Ontario',
      swipeIso: iso,
      lastName: lastName,
      height: faker.random.arrayElement(heights),
      verificationStatus: 'WAITING_FOR_VERIFICATION',
      highestEducation: faker.random.arrayElement(['HIGH_SCHOOL', 'COLLEGE', 'UNIVERSITY', 'POST_GRAD', null]),
      martialStatus: faker.random.arrayElement(['DIVORCED', 'NEVER_MARRIED', 'SINGLE', null]),
      hasChildren: faker.random.arrayElement([true, false, null]),
      occupation: faker.name.jobTitle(),
      firstName: firstName,
      role: role,
      premiumUntil: role === 'PREMIUM' ? faker.date.future() : null,
      state: states[Math.floor(Math.random() * states.length)],
      gender: gender,
      bornAt: dates[Math.floor(Math.random() * dates.length)],
      avatar: gender === 'MALE' ? faker.random.arrayElement(guys) : faker.random.arrayElement(girls),
      highlights: faker.lorem.word(),
      password: faker.internet.password(8),
      swipesLeft: 33,
      encryptedPassword: bcrypt.hashSync(faker.internet.password(8), 10),
      createdAt: new Date(),
      images: [faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls)],
      updatedAt: new Date()
    }).then(async (user) => {
      await db.UserCountry.create({
        name: faker.random.arrayElement(countries),
        UserId: user.id
      })
      await db.UserCountry.create({
        name: faker.random.arrayElement(countries),
        UserId: user.id
      })
      await db.UserCountry.create({
        name: faker.random.arrayElement(countries),
        UserId: user.id
      })
      await db.UserLanguage.create({
        name: faker.random.arrayElement(isos),
        UserId: user.id
      })
      await db.UserLanguage.create({
        name: faker.random.arrayElement(isos),
        UserId: user.id
      })
      await db.UserLanguage.create({
        name: faker.random.arrayElement(isos),
        UserId: user.id
      })
      const interests = await db.Interest.findAll()
      await db.UserInterest.create({
        i18nName: faker.random.arrayElement(interests).i18nName,
        icon: faker.random.arrayElement(interests).icon,
        UserId: user.id
      })
      await db.UserInterest.create({
        i18nName: faker.random.arrayElement(interests).i18nName,
        icon: faker.random.arrayElement(interests).icon,
        UserId: user.id
      })
      await db.UserInterest.create({
        i18nName: faker.random.arrayElement(interests).i18nName,
        icon: faker.random.arrayElement(interests).icon,
        UserId: user.id
      })
    })
  }
}

async function generateVenueUserHistories(number) {
  const loop = [...Array(number)]
  for (const index of loop) {
    const joinedAt = faker.date.recent(0)
    let asd = new Date(joinedAt.getTime())
    const leftAt = asd.setHours(asd.getHours() + 1)
    await db.VenueUserHistory.create({
      VenueId: faker.random.number({'min': 1, 'max': 10}),
      UserId: faker.random.number({'min': 1, 'max': 100}),
      joinedAt: joinedAt,
      leftAt: faker.random.arrayElement([leftAt, null, null, null]),
    })
  }
}

async function generateServiceAreas() {
  await db.ServiceArea.create({
    enabled: true,
    label: 'Hungary',
    iso: 'hu',
    featuredVenueDiscoveryDistance: 10000,
    languageSpoken: 'Hungarian',
    createdAt: new Date(),
    updatedAt: new Date()
  })
  await db.ServiceArea.create({
    enabled: true,
    iso: 'ca',
    label: 'Canada',
    featuredVenueDiscoveryDistance: 60000,
    languageSpoken: 'English',
    createdAt: new Date(),
    updatedAt: new Date()
  })
}

async function generateInternalizations() {
  i18nArray.forEach(async (e) => {
    let int = await db.Internalization.findOne({ where: { i18nName: e.i18nName, language: e.language }})
    if (!int) {
      db.Internalization.create({
        iso: e.iso,
        language: e.language,
        i18nName: e.i18nName,
        name: e.name,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } else {
      int.name = e.name
      int.save()
    }
  })
}

async function generateEvents() {
  db.Event.create({
    templateName: 'hm_welcome_email.html',
    eventName: 'REGISTRATION',
    createdAt: new Date(),
    updatedAt: new Date()
  })
  db.Event.create({
    templateName: 'hm_acc_pause_email.html',
    eventName: 'PAUSE',
    createdAt: new Date(),
    updatedAt: new Date()
  })
  db.Event.create({
    templateName: 'hm_acc_delete_email.html',
    eventName: 'DELETION',
    createdAt: new Date(),
    updatedAt: new Date()
  })
}

async function generateAdmin() {
  const userAdminka = await db.User.create({
    phoneNumber: '+36706258109',
    firstName: 'ADMIN',
    images: [faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls)],
    lastName: 'ADMIN',
    city: 'Budapest',
    region: 'Budapest',
    iso: 'hu',
    country: 'Hungary',
    email: 'admin@gmail.com',
    gender: 'MALE',
    encryptedPassword: bcrypt.hashSync('adminka', 10),
    nrOfDirectMessages: 3,
    smsToken: faker.random.number(),
    serviceArea: 1,
    lang: 'English',
    height: faker.random.arrayElement(heights),
    verificationStatus: 'WAITING_FOR_VERIFICATION',
    role: 'ADMIN',
    premiumUntil: null,
    state: 'ON_BOARDED',
    bornAt: dates[Math.floor(Math.random() * dates.length)],
    avatar: faker.random.arrayElement(guys),
    selfie: [faker.random.arrayElement(guys)],
    highlights: faker.lorem.word(),
    password: faker.internet.password(8),
    swipesLeft: 33,
    createdAt: new Date(),
    updatedAt: new Date(),
    swipeCity: 'Budapest',
    swipeRegion: 'Budapest',
    swipeIso: 'hu',
    swipeCountry: 'Hungary'
  })
  const user = await db.User.create({
    phoneNumber: '+36706258101',
    firstName: 'Male',
    images: [faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls)],
    lastName: 'Halal',
    city: 'Budapest',
    region: 'Budapest',
    iso: 'hu',
    country: 'Hungary',
    email: 'adminka@gmail.com',
    gender: 'MALE',
    encryptedPassword: bcrypt.hashSync('adminka', 10),
    nrOfDirectMessages: 3,
    smsToken: faker.random.number(),
    serviceArea: 1,
    lang: 'English',
    height: faker.random.arrayElement(heights),
    verificationStatus: 'WAITING_FOR_VERIFICATION',
    role: 'USER',
    premiumUntil: null,
    state: 'ON_BOARDED',
    bornAt: dates[Math.floor(Math.random() * dates.length)],
    avatar: faker.random.arrayElement(guys),
    selfie: [faker.random.arrayElement(guys)],
    highlights: faker.lorem.word(),
    password: faker.internet.password(8),
    swipesLeft: 33,
    createdAt: new Date(),
    updatedAt: new Date(),
    swipeCity: 'Budapest',
    swipeRegion: 'Budapest',
    swipeIso: 'hu',
    swipeCountry: 'Hungary'
  })


  await db.UserCountry.create({name: faker.random.arrayElement(countries), UserId: user.id})
  await db.UserCountry.create({name: faker.random.arrayElement(countries), UserId: user.id})
  await db.UserCountry.create({name: faker.random.arrayElement(countries), UserId: user.id})
  await db.UserLanguage.create({name: faker.random.arrayElement(isos), UserId: user.id})
  await db.UserLanguage.create({name: faker.random.arrayElement(isos), UserId: user.id})
  await db.UserLanguage.create({name: faker.random.arrayElement(isos), UserId: user.id})
  const user2 = await db.User.create({
    phoneNumber: '+36706258102',
    firstName: 'Female',
    images: [faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls)],
    lastName: 'Halal',
    city: 'Budapest',
    region: 'Budapest',
    iso: 'hu',
    country: 'Hungary',
    email: 'adminka2@gmail.com',
    gender: 'FEMALE',
    encryptedPassword: bcrypt.hashSync('adminka2', 10),
    nrOfDirectMessages: 3,
    smsToken: faker.random.number(),
    serviceArea: 1,
    lang: 'English',
    height: faker.random.arrayElement(heights),
    verificationStatus: 'WAITING_FOR_VERIFICATION',
    role: 'USER',
    premiumUntil: null,
    state: 'ON_BOARDED',
    bornAt: '1960-01-01',
    avatar: faker.random.arrayElement(girls),
    selfie: [faker.random.arrayElement(girls)],
    highlights: faker.lorem.word(),
    password: faker.internet.password(8),
    swipesLeft: 33,
    createdAt: new Date(),
    updatedAt: new Date(),
    swipeCity: 'Budapest',
    swipeRegion: 'Budapest',
    swipeIso: 'hu',
    swipeCountry: 'Hungary'
  })
  await db.UserCountry.create({name: faker.random.arrayElement(countries), UserId: user2.id})
  await db.UserCountry.create({name: faker.random.arrayElement(countries), UserId: user2.id})
  await db.UserCountry.create({name: faker.random.arrayElement(countries), UserId: user2.id})
  await db.UserLanguage.create({name: faker.random.arrayElement(isos), UserId: user2.id})
  await db.UserLanguage.create({name: faker.random.arrayElement(isos), UserId: user2.id})
  await db.UserLanguage.create({name: faker.random.arrayElement(isos), UserId: user2.id})
  const user3 = await db.User.create({
    phoneNumber: '+36706258103',
    firstName: 'Female2',
    images: [faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls)],
    lastName: 'Halalina',
    city: 'Budapest',
    region: 'Budapest',
    iso: 'hu',
    country: 'Hungary',
    email: 'adminka3@gmail.com',
    gender: 'FEMALE',
    encryptedPassword: bcrypt.hashSync('adminka2', 10),
    nrOfDirectMessages: 3,
    smsToken: faker.random.number(),
    serviceArea: 1,
    lang: 'English',
    height: faker.random.arrayElement(heights),
    verificationStatus: 'WAITING_FOR_VERIFICATION',
    role: 'USER',
    premiumUntil: null,
    state: 'ON_BOARDED',
    bornAt: '1960-01-01',
    avatar: faker.random.arrayElement(girls),
    selfie: [faker.random.arrayElement(girls)],
    highlights: faker.lorem.word(),
    password: faker.internet.password(8),
    swipesLeft: 33,
    createdAt: new Date(),
    updatedAt: new Date(),
    swipeCity: 'Budapest',
    swipeRegion: 'Budapest',
    swipeIso: 'hu',
    swipeCountry: 'Hungary'
  })
  await db.UserCountry.create({name: faker.random.arrayElement(countries), UserId: user3.id})
  await db.UserCountry.create({name: faker.random.arrayElement(countries), UserId: user3.id})
  await db.UserCountry.create({name: faker.random.arrayElement(countries), UserId: user3.id})
  await db.UserLanguage.create({name: faker.random.arrayElement(isos), UserId: user3.id})
  await db.UserLanguage.create({name: faker.random.arrayElement(isos), UserId: user3.id})
  await db.UserLanguage.create({name: faker.random.arrayElement(isos), UserId: user3.id})


  const user4 = await db.User.create({
    phoneNumber: '+36706258104',
    firstName: 'Employee',
    images: [faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls)],
    lastName: 'I am',
    city: 'Budapest', region: 'Budapest',
    iso: 'hu',
    country: 'Hungary',
    email: 'employeeka@gmail.com',
    gender: 'FEMALE',
    encryptedPassword: bcrypt.hashSync('adminka2', 10),
    nrOfDirectMessages: 3,
    smsToken: faker.random.number(),
    serviceArea: 1,
    lang: 'English',
    height: faker.random.arrayElement(heights),
    verificationStatus: 'WAITING_FOR_VERIFICATION',
    role: 'EMPLOYEE',
    premiumUntil: null,
    state: 'ON_BOARDED',
    bornAt: '1960-01-01',
    avatar: faker.random.arrayElement(girls),
    selfie: [faker.random.arrayElement(girls)],
    highlights: faker.lorem.word(),
    password: faker.internet.password(8),
    swipesLeft: 33,
    createdAt: new Date(),
    updatedAt: new Date(),
    swipeCity: 'Budapest',
    swipeRegion: 'Budapest',
    swipeIso: 'hu',
    swipeCountry: 'Hungary'
  })

  const user5 = await db.User.create({
    phoneNumber: '+36706258105',
    firstName: 'Fake',
    images: [faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls), faker.random.arrayElement(girls)],
    lastName: 'Userka',
    city: 'Budapest', region: 'Budapest',
    iso: 'hu',
    country: 'Hungary',
    email: 'fakeuserka@gmail.com',
    gender: 'FEMALE',
    encryptedPassword: bcrypt.hashSync('adminka2', 10),
    nrOfDirectMessages: 3,
    smsToken: faker.random.number(),
    serviceArea: 1,
    lang: 'English',
    height: faker.random.arrayElement(heights),
    verificationStatus: 'WAITING_FOR_VERIFICATION',
    role: 'FAKE_USER',
    premiumUntil: null,
    state: 'ON_BOARDED',
    bornAt: '1960-01-01',
    avatar: faker.random.arrayElement(girls),
    selfie: [faker.random.arrayElement(girls)],
    highlights: faker.lorem.word(),
    password: faker.internet.password(8),
    swipesLeft: 33,
    createdAt: new Date(),
    updatedAt: new Date(),
    swipeCity: 'Budapest',
    swipeRegion: 'Budapest',
    swipeIso: 'hu',
    swipeCountry: 'Hungary'
  })

}

async function generateSiteSettings() {
  await db.SiteSettings.create({
    swipeLimit: 33,
    defaultEmailAddress: "halalmeet@gmail.com",
    smsTokenExpirationInMinutes: 5,
    termsAndConditions: require('./db/privacyPolicy'),
    privacyPolicy: require('./db/privacyPolicy'),
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })
}

async function generateSubscriberPlans() {
  await db.SubscriberPlan.create({
    productId: 'subscription_3',
    lengthInMonths: 3,
    i18NTitle: "PLAN_ONE",
    createdAt: new Date(),
    updatedAt: new Date()
  })
  await db.SubscriberPlan.create({
    productId: 'subscription_6',
    lengthInMonths: 6,
    i18NTitle: "PLAN_TWO",
    createdAt: new Date(),
    updatedAt: new Date()
  })
  await db.SubscriberPlan.create({
    productId: 'subscription_12',
    lengthInMonths: 12,
    i18NTitle: "PLAN_THREE",
    createdAt: new Date(),
    updatedAt: new Date()
  })
}

async function generateDirectMessagePlans() {
  await db.DirectMessagePlan.create({
    productId: 'direct_message_3',
    quantity: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  await db.DirectMessagePlan.create({
    productId: 'direct_message_6',
    quantity: 6,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  await db.DirectMessagePlan.create({
    productId: 'direct_message_12',
    quantity: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  })
}

async function generateIceBreakers(numberOfIceBreakersToGenerate) {
  let loop = [...Array(numberOfIceBreakersToGenerate)]
  for (const index of loop) {
    await db.IceBreaker.create({
      i18nName: faker.random.arrayElement(i18nArray).i18nName,
      language: 'English',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
}

async function generatePayments(numberOfPaymentsToGenerate) {
  let loop = [...Array(numberOfPaymentsToGenerate)]
  for (const index of loop) {
    await db.Payment.create({
      userId: faker.random.number({'min': 1, 'max': 100}),
      price: faker.random.arrayElement([50, 100, 170, 10, 30, 250, 500]),
      productType: faker.random.arrayElement(['PREMIUM', 'DIRECT_MESSAGE']),
      createdAt: faker.date.between('2015-08-01', '2020-08-10'),
      updatedAt: faker.date.between('2015-08-01', '2020-08-10')
    })
  }
}

async function generateInterests(numberOfInterestsToGenerate) {
  let loop = [...Array(numberOfInterestsToGenerate)]
  for (const index of loop) {
    await db.Interest.create({
      icon: faker.random.arrayElement(icons),
      i18nName: faker.random.arrayElement(i18nArray).i18nName,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
}

async function generateLocationSubscribers(numberOfLocationSubscribersToGenerate) {
  let loop = [...Array(numberOfLocationSubscribersToGenerate)]
  for (const index of loop) {
    await db.LocationSubscriber.create({
      email: faker.internet.email(),
      city: faker.address.city(),
      iso: faker.random.arrayElement(countries),
      location: {type: 'Point', coordinates: [faker.address.latitude(), faker.address.longitude()]},
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
}

async function generateUserBlocks(numberOfUserBlocksToGenerate) {
  let loop = [...Array(numberOfUserBlocksToGenerate)]
  for (const index of loop) {
    await db.UserBlock.create({
      userId: faker.random.number({'min': 1, 'max': 100}),
      blockedUserId: faker.random.number({'min': 1, 'max': 100}),
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
}

async function generateFakeUserSwipes() {
  const fakeUsers = await db.User.findAll({ where: { role: 'FAKE_USER' }})
  const users = await db.User.findAll({ where: { role: 'USER' }})
  for (const user of users) {
    await db.UserMatch.create({
      user1Id: user.id,
      user1Response: true,
      user2Id: faker.random.arrayElement(fakeUsers).id,
      user2Response: faker.random.arrayElement([true,false]),
      accepted: true,
      type: 'SWIPE',
      createdAt: new Date(),
      updatedAt: new Date(),
      employeeId: 4
    })
  }
}

module.exports = router;
