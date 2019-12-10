//Include needed jsons
var config = require('./config');
var permsJson = require('./data/permissionsList');
var changelog = require('./data/changelog');
var secret = require('./secret');

//Include some Funktions
const f = require('./src/Funktions');
//getDateTime() Returns german date & time Format
//log() Logs with Time and Date
const vag = require('./src/VAGAPIPromise');
//haltestellen(Name) Returns the API Response with the given name 
const perms = require('./src/Permissions');
//permissions(TG UserID) Returns a var with the Permissions Level
const SQL = require('./src/SQL');
//requestData(TG UserID) Returns a Object with all lines of the first row
const OS = require('./src/Hardware')
//Hardware() returns a Objectwith CPU and RAM

//Include simple modules
var fs = require("fs");
const util = require('util');
const mysql = require('mysql'); 
const hash = require('hash-int');
const newI18n = require('new-i18n');
const i18n = newI18n(__dirname + '/languages', ['en', 'de']);

//Include complex modules
const Telebot = require('telebot');
const bot = new Telebot({
	token: secret.bottoken,
	limit: 1000,
        usePlugins: ['commandButton']
});


//Database
var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbreaduserhost,
	user: config.dbreaduser,
	password: secret.dbreaduserpwd,
	database: config.database,
	charset : 'utf8mb4'
});

//Create and modify support variables
var Time_started = new Date().getTime();
var botname = config.botname;
var version = config.botversion;
let versionfix = version.replace(/[.]/g,'_',);

var changelog_latest = changelog[versionfix];
var LastConnectionLost = new Date();

bot.start(); //Telegram bot start


//Startup Message
setTimeout(function(){
console.log("Bot (" + botname + ") started at " + f.getDateTime(new Date()) + " with version " + version)
OS.Hardware.then(function(Hardware) {
	let Output = "Bot started on Version " + version;
	Output = Output + '\n- CPU: ' + Hardware.cpubrand + ' ' + Hardware.cpucores + 'x' + Hardware.cpuspeed + ' Ghz';
	Output = Output + '\n- Load: ' + f.Round2Dec(Hardware.load);
	Output = Output + '%\n- Memory Total: ' + f.Round2Dec(Hardware.memorytotal/1073741824) + ' GB'
	Output = Output + '\n- Memory Free: ' + f.Round2Dec(Hardware.memoryfree/1073741824) + ' GB'
	bot.sendMessage(config.LogChat, Output)
	//console.log(Hardware);
});
f.log("Pushed bot start to the admin");
}, 2000);

//Telegram Errors
bot.on('reconnecting', (reconnecting) => {
	f.log(util.inspect(reconnecting, true, 99));
	f.log("Lost connection");
	var LastConnectionLost = new Date();
});
bot.on('reconnected', (reconnected) => {
	f.log(util.inspect(reconnected, true, 99));
	f.log("connection successfully");
	bot.sendMessage(config.LogChat, "Bot is back online. Lost connection at " + f.getDateTime(LastConnectionLost))
});

//Userimput
//Basics
bot.on(/^\/botinfo$/i, (msg) => {
	var LastConnectionLost = new Date();
	var language = 'de';
	msg.reply.text(i18n(language, 'botinfo', { botname: botname, version: version, changelog_latest: changelog_latest})).then(function(msg)
					{
                     setTimeout(function(){
                             bot.deleteMessage(msg.chat.id,msg.message_id);
                     }, config.WTdelmsglong);
             });
             bot.deleteMessage(msg.chat.id, msg.message_id);
});

bot.on(/^\/start$/i, (msg) => {
	var LastConnectionLost = new Date();
	bot.deleteMessage(msg.chat.id, msg.message_id);
	if(msg.chat.type != "private")
	{
		if(msg.text.split(' ')[0].endsWith(botname))
		{
		let startmsg = "Test";
		msg.reply.text(startmsg).then(function(msg)
	                        {
	                                setTimeout(function(){
	                                        bot.deleteMessage(msg.chat.id,msg.message_id);
	                                }, config.WTdelmsglong);
	                        });
		bot.deleteMessage(msg.chat.id, msg.message_id);
		}
	}else{
		let startmsg = "Test";
		msg.reply.text(startmsg);
		bot.deleteMessage(msg.chat.id, msg.message_id);
	}
});

bot.on(/^\/haltestellen( .+)*$/i, (msg, props) => {
		var LastConnectionLost = new Date();
		bot.deleteMessage(msg.chat.id, msg.message_id);
        var Para = props.match[1]
		if(typeof(Para) === 'undefined'){
			msg.reply.text("You didn´t provided me with a name... I can´t send you all of them :P");
		}else{
			perms.permissions(msg.from.id, function(Permissions) {
				if(Permissions >= permsJson.regUser){
					//console.log(Permissions);
					vag.Haltestellen(Para).then(function(Haltestellen) {
						var Message = "Station that contain '" + Para + "':\n\n";
						if(Object.entries(Haltestellen).length === 0){
							msg.reply.text("I´m sorry, i couldn´t find any stations that contain: " + Para + ".");
						}else{
							//console.log(Haltestellen);
							for(var i in Haltestellen){
								let i1 = +i +1;
								var Message = Message + "(" + i1 +") `" + Haltestellen[i].Haltestellenname + "`\n - Ort: " + Haltestellen[i].Ort + "\n - Verkehrsmittel: " + Haltestellen[i].Produkte + "\n\n";
							}
							bot.sendMessage(msg.chat.id, Message, { parseMode: 'markdown', webPreview: false });
						};
					})
				}else{
					msg.reply.text("I´m sorry, i´m not allowed to awnser you");
				}
			});
		}
});

bot.on('location', (location) => {
	var LastConnectionLost = new Date();
		perms.permissions(location.from.id, function(Permissions) {
		if(Permissions >= permsJson.regUser){
			//console.log(location.from.id)
			SQL.requestData(location.from.id, function(rows) {
				var Data = {
					lat: location.location.latitude,
					lon: location.location.longitude,
					distance: rows.distance, //Get From DB for User
					sort: rows.sort, //or Alphabetically
					mode: 'count', //Static used to auto call Abfarten for eatch element. Currently not implemented
					para: 3, //Get From DB for USER used to auto call Abfarten for eatch element. Currently not implemented
				};
				//console.log(rows);
				vag.OnLocation(Data).then(function(Haltestellen) {
					var Message = "Stations in radius " + rows.distance + "m :\n\n";
					if(Object.entries(Haltestellen).length === 0){
						bot.sendMessage(location.from.id, "I´m sorry, i couldn´t find any stations in your area.\nDistance: " + Data.distance);
					}else{
						for(let i in Haltestellen){
							let i1 = +i +1;
							var Message = Message + "(" + i1 +") `" + Haltestellen[i].Haltestellenname + "` (" + Haltestellen[i].Distance + "m)" + "\n - Ort: " + Haltestellen[i].Ort + "\n - Verkehrsmittel: " + Haltestellen[i].Produkte + "\n\n";
						};
				
					}
					//console.log(Message);
					bot.sendMessage(location.from.id, Message, { parseMode: 'markdown', webPreview: false });
				});
			});
		}else{
			msg.reply.text("I´m sorry, i´m not allowed to awnser you");
		}
	});
});

//UserManagment
bot.on(/^\/register/i, (msg) => {
	var LastConnectionLost = new Date();
	//console.log(msg.from.username);
	var user = {
		id: msg.from.id,
		name: 'Anonym'
	};
	perms.permissions(msg.from.id, function(Permissions) {
		if(Permissions === "0"){
			perms.register(user, function(result) {
				msg.reply.text("You are now registert!");
			});
		}else{
			msg.reply.text("You are already registert\nYour current level is:" + Permissions);
		}
	});
});

bot.on(/^\/unregister/i, (msg) => {
	var LastConnectionLost = new Date();
	var user = {
		id: msg.from.id,
		name: msg.from.username
	};
	perms.permissions(msg.from.id, function(Permissions) {
		if(Permissions >= "1"){
			perms.unregister(user, function(result) {
				msg.reply.text("I forgot everything about you...\nResult:\nAffectedRows: " + result.affectedRows,);
			});
		}else{
			msg.reply.text("You are unkown...");
		}
	});
});

//Callback Handling

//Funktions

/*function test(){
var Data = {
	lat: '49.45015694',
	lon: '11.083455',
	distance: 500, //Get From DB for User
	sort: 'Distance', //or Alphabetically
	mode: 'count', //Static
	para: 3, //Get From DB for USER
	};
	vag.OnLocation(Data, function(Haltestellen) {
		//console.log(Haltestellen)
	});
}*/

