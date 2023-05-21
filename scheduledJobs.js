const {sendMessageToUser} = require("./sockets/socketio");

const db = require('./models');
const cron = require("node-cron");
const moment = require('moment');

module.exports = () => {
  console.log(" SCHEDULING CRON JOBS")
  cron.schedule('0 * * * *', resetUserSwipes, {scheduled: true})
  cron.schedule('0 0 * * *', deleteSmsTokens, {scheduled: true})
  cron.schedule('0 * * * *', resetPremium, {scheduled: true})
  cron.schedule('0 0 * * *', resetNotificationsReceived, {scheduled: true})
  cron.schedule('0 * * * *', generateBadges, {scheduled: true})
  cron.schedule('0 * * * *', deleteBadges, {scheduled: true})
  cron.schedule('0 * * * *', kickInactiveFromVenue, {scheduled: true})
}

const resetPremium = async () => {
  console.log("RESETTING USER PREMIUMS...")
  let users = await db.User.findAll({where: {premiumUntil: {[db.Sequelize.Op.lte]: Date.now()}}})
  users.forEach(e => {
    e.role = 'USER'
    e.premiumUntil = null
    e.freezeLocation = false
    e.swipeCity = e.city
    e.swipeCountry = e.country
    e.swipeIso = e.iso
    e.swipeRegion = e.region

    sendMessageToUser(e.id, 'refresh-user-data', {})
    e.save()
  })
  await deleteVip()

}

const resetNotificationsReceived = async () => {
  console.log("RESETTING USER NOTIFICATIONS RECEIVED...")
  await db.User.update(
    { notificationsReceived: 0 },
    {where: {  }}
  )
}
const kickInactiveFromVenue = async () => {
  console.log("KICKING INACTIVE USERS FROM VENUES")
  await db.VenueUserHistory.update(
    { leftAt: Date.now() },
    {where: {joinedAt: {[db.Sequelize.Op.lte]: moment(new Date()).add(-24, 'hours')}, leftAt: null }}
  )
}

const resetUserSwipes = async () => {
  try {
    console.log("RESETTING USER SWIPES...")
    const siteSetting = await db.SiteSettings.findLatestEnabledOrDefault()
    await db.User.update({swipesLeft: siteSetting.swipeLimit, ranOutOfSwipesAt: null }, {where: { ranOutOfSwipesAt: { [db.Sequelize.Op.lte]: moment(Date.now()).subtract(1, 'days').toDate() } }})
  } catch (e) {
    console.log('ERROR RESETTING USER SWIPES: ', e)
  }
}

const deleteSmsTokens = async () => {
  try {
    console.log("DELETING EXPIRED SMS TOKENS...")
    await db.User.update(
      {smsToken: null},
      {where: {smsTokenExpiresAt: {[db.Sequelize.Op.lte]: Date.now()}}}
    )
  } catch (e) {
    console.log('ERROR DELETING VIP: ', e)
  }
}

const generateBadges = async () => {
  console.log("GENERATING FAST RESPONDER")
  try {
    await db.sequelize.query(`
      insert into "UserBadges"("userId", badge, "createdAt", "updatedAt")
          (
              select k.id, 'FAST_RESPONDER' as badge, current_date, current_date
              from (
                       select u.id                                                    as id,
                              avg(DATE_PART('day', m."createdAt" - conv."createdAt")) as responseTime,
                              count(distinct conv.id)                                 as convCount
                       from "Users" u
                                join "Conversations" conv on (conv."user1Id" = u.id or conv."user2Id" = u.id)
                                join (select m.receiver, m.sender, m."createdAt", m."ConversationId"
                                      from "Messages" m
                                      where m."createdAt" in (
                                          select min(m."createdAt")
                                          from "Messages" m
                                                   join "Conversations" c on c.id = m."ConversationId"
                                          where m."isResponse" = true
                                          group by m.receiver, m.sender)
                       ) m on u.id = m.sender and conv.id = m."ConversationId"
                       group by u.id
                   ) k
                       left join (select * from "UserBadges" where badge = 'FAST_RESPONDER') badge
                                 on badge."userId" = k.id
              where responseTime < 1
                and badge.id is null
                and k.convCount > 0
          );
  `)

    console.log("GENERATING POPULAR")
    await db.sequelize.query(`insert into "UserBadges"("userId", badge, "createdAt", "updatedAt")
                                (
                                    select k.id, 'POPULAR' as badge, current_date, current_date
                                    from (
                                             select u.id,
                                                    u.gender,
                                                    cast(count(matches.id) as decimal) /
                                                    (count(matches.id) + max(pass.swipes)) as rate
                                             from "Users" u
                                                      join "UserMatches" matches
                                                           on (u.id = matches."user1Id" and matches."user2Response" = true) or
                                                              (u.id = matches."user2Id" and matches."user1Response" = true) and matches.type = 'SWIPE'
                                                      left join (
                                                 select u.id, count(*) as swipes, 'pass' as result
                                                 from "Users" u
                                                          join "UserMatches" matches
                                                               on (u.id = matches."user1Id" and matches."user2Response" = false) or
                                                                  (u.id = matches."user2Id" and matches."user1Response" = false) and matches.type = 'SWIPE'
                                                 group by u.id
                                             ) pass on pass.id = u.id
                                             group by u.id) k

                                             left join (select * from "UserBadges" where badge = 'POPULAR') badge
                                                       on badge."userId" = k.id

                                    where ((gender = 'FEMALE' AND RATE > 0.7) OR (GENDER = 'MALE' AND RATE > 0.4))
                                      and badge.id is null
                                );`)

    console.log('GENERATING ACTIVE')
    await db.sequelize.query(`insert into "UserBadges"("userId", badge, "createdAt", "updatedAt")
                                (
                                    select u.id, 'ACTIVE' as badge, current_date, current_date
                                    from "Users" u
                                             left join (select * from "UserBadges" where badge = 'ACTIVE') badge
                                                       on badge."userId" = u.id
                                    WHERE (current_date - '7 days'::interval) < u."updatedAt"
                                      and badge.id is null
                                );`)

    console.log('GENERATING VIP')
    await db.sequelize.query(`insert into "UserBadges"("userId", badge, "createdAt", "updatedAt")
                                (
                                    select u.id, 'VIP' as badge, current_date, current_date
                                    from "Users" u
                                             left join (select * from "UserBadges" where badge = 'VIP') badge
                                                       on badge."userId" = u.id
                                    WHERE u.role = 'PREMIUM_USER' and badge.id is null
                                );`)

  } catch (e) {
    console.log('ERROR IN GENERATING BADGES: ', e)
  }

}

const deleteBadges = async () => {
  try {
    console.log("DELETING BADGES")
    await db.sequelize.query(`
      delete
      from "UserBadges" k
      where k."badge" = 'FAST_RESPONDER'
        and k."userId" in (
          select id
          from (
                   select u.id                                                    as id,
                          avg(DATE_PART('day', m."createdAt" - conv."createdAt")) as responseTime
                   from "Users" u
                            join "Conversations" conv on (conv."user1Id" = u.id or conv."user2Id" = u.id)
                            join (select m.receiver, m.sender, m."createdAt", m."ConversationId"
                                  from "Messages" m
                                  where m."createdAt" in (
                                      select min(m."createdAt")
                                      from "Messages" m
                                               join "Conversations" c on c.id = m."ConversationId"
                                      where m."isResponse" = true
                                      group by m.receiver, m.sender)
                   ) m on u.id = m.sender and conv.id = m."ConversationId"
                   group by u.id
               ) k
          where responseTime > 0
      );
  `)

    console.log("DELETING POPULAR")
    await db.sequelize.query(`delete
                            from "UserBadges" u
                            where u.badge = 'POPULAR'
                              AND u."userId" in (
                                select k.id
                                from (
                                         select u.id,
                                                u.gender,
                                                cast(count(matches.id) as decimal) /
                                                (count(matches.id) + max(pass.swipes)) as rate
                                         from "Users" u
                                                  join "UserMatches" matches
                                                       on (u.id = matches."user1Id" and matches."user2Response" = true) or
                                                          (u.id = matches."user2Id" and matches."user1Response" = true) and matches.type = 'SWIPE'
                                                  left join (
                                             select u.id, count(*) as swipes, 'pass' as result
                                             from "Users" u
                                                      join "UserMatches" matches
                                                           on (u.id = matches."user1Id" and matches."user2Response" = false) or
                                                              (u.id = matches."user2Id" and matches."user1Response" = false) and matches.type = 'SWIPE'
                                             group by u.id
                                         ) pass on pass.id = u.id
                                         group by u.id) k
                                where ((gender = 'FEMALE' AND RATE <= 0.7) OR (GENDER = 'MALE' AND RATE <= 0.4))
                            );
  `)

    console.log('DELETING ACTIVE')
    await db.sequelize.query(`delete
                            from "UserBadges" u
                            where u.badge = 'ACTIVE'
                              AND u."userId" in (
                                select k.id
                                from (
                                         select u.id
                                         from "Users" u
                                                  left join (select * from "UserBadges" where badge = 'ACTIVE') badge
                                                            on badge."userId" = u.id
                                         WHERE (current_date - '7 days'::interval) > u."updatedAt"
                                     ) k
                            );`)

    await deleteVip()
  } catch (e) {
    console.log('ERROR IN DELETING BADGES: ', e)
  }
}

async function deleteVip () {
  console.log('DELETING VIP')
  await db.sequelize.query(`delete
                            from "UserBadges" u
                            where u.badge = 'VIP'
                              AND u."userId" in (
                                select k.id
                                from (
                                         select u.id
                                         from "Users" u
                                         WHERE u.role != 'PREMIUM_USER'
                                     ) k
                            );`)
}