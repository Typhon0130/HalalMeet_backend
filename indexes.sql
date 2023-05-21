CREATE INDEX readConversationIndex ON "UserMatches" ("user1Id", "user2Id", "user1Response", "user2Response");
CREATE INDEX unReadConversationIndex ON "UserMatches" ("user1Id", "user2Id", "user1Response", "user2Response", "accepted");
CREATE INDEX matchIndex ON "UserMatches" ("user1Id", "user2Id", "user1Response", "user2Response", "accepted");
CREATE INDEX profileIndex ON "UserMatches" ("user1Id", "user2Id", "user1Response", "user2Response", "accepted");
CREATE INDEX unReadConversationIndex ON "UserMatches" ("user1Id", "user2Id", "user1Response", "user2Response", "accepted");
CREATE INDEX unReadConversationIndex ON "UserMatches" ("user1Id", "user2Id", "user1Response", "user2Response", "accepted");