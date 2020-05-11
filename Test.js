var VAG = require("./src/VAGAPIPromise");
var Twitter = require("./src/Twitter");
var OS = require("./src/Hardware");
var f = require("./src/Funktions");
var LocalDB = require("./src/LocalBufferDB");
const SpamWatch = require('spamwatch');
const client = new SpamWatch.Client("Token");
var Name = 'Moorenbrunn';

 /*VAG.Haltestellen(Name).then(
    function(message) {
     console.log(message);
    });*/
/*
var Data = {
    lat: '49.45015694',
    lon: '11.083455',
    distance: 250, //Get From DB for User
    sort: 'Distance', //or Alphabetically
    mode: 'count', //Static
    limit: 3, //Get From DB for USER
    };

 VAG.OnLocation(Data)
	.then(
    function(message) {
     console.log(message);
    })
	.catch(
	function(message) {
     console.log("Error" + message);
    });

OS.Hardware.then(function(Hardware) {
    let Output = "Test Tweet:\n";
    Output = Output + "\n- CPU: " + Hardware.cpubrand + " " + Hardware.cpucores + "x" + Hardware.cpuspeed + " Ghz";
    Output = Output + "\n- Load: " + f.Round2Dec(Hardware.load);
    Output = Output + "%\n- Memory Total: " + f.Round2Dec(Hardware.memorytotal/1073741824) + " GB"
    Output = Output + "\n- Memory Free: " + f.Round2Dec(Hardware.memoryfree/1073741824) + " GB"
    Twitter.Tweet(Output).then(function(Tweet){
        console.log(Tweet.url)
    })
});
*/
/*
LocalDB.updateDB().then(function(result){
    console.log(result);
})
*/
(async () => {
    const ban = await client.getBan(206921999);
    console.log(ban);
})();

