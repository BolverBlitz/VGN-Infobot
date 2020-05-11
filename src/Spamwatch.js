var config = require("../config");
var secret = require("../secret");
const SpamWatch = require('spamwatch');
const client = new SpamWatch.Client(secret.spamwatch);

let checkUser = async function (User) {
    User.ban = await client.getBan(User.userid);
    return User;
};

module.exports = {
	checkUser
};