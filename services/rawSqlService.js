const buildFindPossibleMatchesQuery = function (countries) {
  const hasCountries = !!(countries && countries.length > 0)
  return `
(select
    u.id, u."firstName", u."lastName", u."bornAt", u.avatar, u.highlights, u.height, u.images, badge.badges as badges, uoc.countries, ui.interests, u."swipeCountry", u."swipeCity", u."swipeRegion"
from (select * from "Users" u
      where u.state = 'ON_BOARDED'
        and u.state != 'BANNED'
        and (U."swipeCity" = :city or U."swipeRegion" = :region or U."swipeIso" = :country)
        and u."bornAt" between to_date(:maxBornAt, 'YYYY-MM-DD') and to_date(:minBornAt, 'YYYY-MM-DD')
     ) u
         LEFT JOIN "UserBlocks" ub ON (U.id = UB."blockedUserId" or U.id = UB."userId")
         LEFT JOIN (select "UserId" , string_agg(uoc.name,',') as countries from "UserCountries" uoc group by "UserId") uoc on uoc."UserId" = u.id
         LEFT JOIN (select ui."UserId", string_agg(ui.icon,',') as interests from "UserInterests" ui group by ui."UserId") ui on ui."UserId" = u.id
         LEFT JOIN (select badge."userId", string_agg(badge.badge,',') as badges from "UserBadges" badge group by badge."userId") badge on badge."userId" = u.id
         ${hasCountries ? 'LEFT JOIN "UserCountries" uc ON (U.id = uc."UserId" and uc.name IN (:countries))' : ''}
         LEFT JOIN "UserMatches" um ON (U.id = UM."user1Id" and UM."user2Id" = :userId) or (U.id = UM."user2Id" and UM."user1Id" = :userId)
where u.id != :userId
  ${hasCountries ? 'and coalesce(uc."name", null) is not null' : '' }
  and coalesce(ub."userId",0) != :userId
  and coalesce(um."user1Id",0) != :userId and coalesce(um."user2Id",0) != :userId
  and u.gender != :userGender
  and u.role != 'EMPLOYEE' and u.role != 'ADMIN'
  and u.state = 'ON_BOARDED'
  and u.state = 'ON_BOARDED'
  and u."freezeLocation" IN (:freezeLocations)
  and u."verificationStatus" != 'REJECTED'
order by u.id desc
fetch first :limit rows only)

union all

(select
 u.id, u."firstName", u."lastName", u."bornAt", u.avatar, u.highlights, u.height, u.images, badge.badges as badges, uoc.countries, ui.interests, u."swipeCountry", u."swipeCity", u."swipeRegion"
from (select * from "Users" u
      where u.state = 'ON_BOARDED'
        and u.state != 'BANNED'
        and (U."swipeCity" = :city or U."swipeRegion" = :region or U."swipeIso" = :country)
        and u."bornAt" between to_date(:maxBornAt, 'YYYY-MM-DD') and to_date(:minBornAt, 'YYYY-MM-DD')
     ) u
         LEFT JOIN "UserBlocks" ub ON (U.id = UB."blockedUserId" or U.id = UB."userId")
         LEFT JOIN (select "UserId" , string_agg(uoc.name,',') as countries from "UserCountries" uoc group by "UserId") uoc on uoc."UserId" = u.id
         LEFT JOIN (select ui."UserId", string_agg(ui.icon,',') as interests from "UserInterests" ui group by ui."UserId") ui on ui."UserId" = u.id
         LEFT JOIN (select badge."userId", string_agg(badge.badge,',') as badges from "UserBadges" badge group by badge."userId") badge on badge."userId" = u.id
         ${hasCountries ? 'LEFT JOIN "UserCountries" uc ON (U.id = uc."UserId" and uc.name IN (:countries))' : ''}
         LEFT JOIN "UserMatches" um ON (U.id = UM."user1Id" and UM."user2Id" = :userId) or (U.id = UM."user2Id" and UM."user1Id" = :userId)
          where u.id != :userId
            and coalesce(ub."userId",0) != :userId
            and coalesce(um."user1Id",0) != :userId and um."user2Id"= :userId
            ${hasCountries ? 'and coalesce(uc."name", null) is not null' : '' }
           -- old code and um."user1Response" = true and um."user2Response" is null
           -- new code and um."user2Response" is null
            and u.gender != :userGender
            and u.role != 'EMPLOYEE' and u.role != 'ADMIN'
            and u.state = 'ON_BOARDED'
            and u."verificationStatus" != 'REJECTED'
          order by u.id desc
          fetch first 1 rows only)
          order by id
  `
}

const serveLoggedInUserLiked = `select u."id", u."avatar", u."firstName", u."lastName", um."updatedAt", string_agg(uc.name,',') as countries, um.id as matchId 
from "UserMatches" um
         left join "Users" u on (um."user1Id" = u.id and um."user2Id" = :userId) or (um."user2Id" = u.id and um."user1Id" = :userId)
  left join "UserCountries" UC on u.id = UC."UserId"
  LEFT JOIN "UserBlocks" ub ON (U.id = UB."blockedUserId" or U.id = UB."userId")
  where ((um."user1Id" = :userId and um."user1Response" = true)
      or (um."user2Id" = :userId and um."user2Response" = true))
    and coalesce(ub."userId",0) != :userId
  group by u."firstName", u."lastName", u.id, um."updatedAt", um."id"
  order by um."updatedAt" desc
  limit 100
  offset :skip
`

const serveLoggedInUserLikedMe = `
    select u."id", u."avatar", u."firstName", u."lastName", u."bornAt", um."updatedAt", string_agg(uc.name,',') as countries, um.id as matchId
    from "UserMatches" um
             left join "Users" u on (um."user2Id" = u.id and um."user1Id" = :userId) or (um."user1Id" = u.id and um."user2Id" = :userId)
             left join "UserCountries" UC on u.id = UC."UserId"
             LEFT JOIN "UserBlocks" ub ON (U.id = UB."blockedUserId" or U.id = UB."userId")
    where (
          (um."user2Id" = :userId and um."user1Response" = true) or 
          (um."user1Id" = :userId and um."user2Response" = true) or 
          (um."user1Id" = :userId and um."accepted" = true and um."type" = 'DIRECT_MESSAGE')
        )
      and coalesce(ub."userId",0) != :userId
    group by u."firstName", u."lastName", u.id, um."updatedAt", um."id"
    order by um."updatedAt" desc
        limit 100
    offset :skip
`

const serveLoggedInUserPassed = `
    select u."id", u."avatar", u."firstName", u."lastName", u."bornAt", um."updatedAt", string_agg(uc.name,',') as countries, um.id as matchId
    from "UserMatches" um
             left join "Users" u on (um."user2Id" = u.id and um."user1Id" = :userId) or (um."user1Id" = u.id and um."user2Id" = :userId)
             left join "UserCountries" UC on u.id = UC."UserId"
             LEFT JOIN "UserBlocks" ub ON (U.id = UB."blockedUserId" or U.id = UB."userId")
    where ((um."user1Id" = :userId and um."user1Response" = false)
        or (um."user2Id" = :userId and um."user2Response" = false))
      and coalesce(ub."userId",0) != :userId
    group by u."firstName", u."lastName", u.id, um."updatedAt", um."id"
    order by um."updatedAt" desc
        limit 100
    offset :skip
`


module.exports = {
  buildFindPossibleMatchesQuery,
  serveLoggedInUserLikedMe,
  serveLoggedInUserPassed,
  serveLoggedInUserLiked,
}
