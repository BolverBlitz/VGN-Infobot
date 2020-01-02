var config = require('../config');
var secret = require('../secret');

var Twitter = require('twitter');

var client = new Twitter({
  consumer_key: secret.twitter[0].consumer_key,
  consumer_secret: secret.twitter[0].consumer_secret,
  access_token_key: secret.twitter[0].access_token_key,
  access_token_secret: secret.twitter[0].access_token_secret
});

let Tweet = function(text) {
	return new Promise(function(resolve, reject) {
		client.post('statuses/update', {status: text}, function(error, tweet, response) {
			if (!error) {
				tweet.url = 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;
				resolve(tweet);
			}else{
				console.log(error)
				throw error;
			}
		});
	});
}

module.exports = {
	Tweet
};
