//Include needed jsons
var config = require("./config");
var permsJson = require("./data/permissionsList");
var changelog = require("./data/changelog");
var secret = require("./secret");

//Include some Funktions
const f = require("./src/Funktions");
//getDateTime() Returns german date & time Format
//log() Logs with Time and Date
const vag = require("./src/VAGAPIPromise");
//haltestellen(Name) Returns the API Response with the given name 
const perms = require("./src/Permissions");
//permissions(TG UserID) Returns a var with the Permissions Level
const SQL = require("./src/SQL");
//requestData(TG UserID) Returns a Object with all lines of the first row
const LocalDB = require("./src/LocalBufferDB");
//UpdateDB() Will refresh all Stations the VAG API Provides
//lookup(Object) .lookup is the string to look for .mode is the think you search for (Haltestellenname, VGNKennung, etc)
const OS = require("./src/Hardware")
//Hardware() returns a Objectwith CPU and RAM

//Include simple modules
var fs = require("fs");
const util = require('util');
const mysql = require('mysql'); 
const hash = require('hash-int');
const newI18n = require("new-i18n");
const i18n = newI18n(__dirname + "/languages", ["en", "de"]);

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

//var changelog_latest = changelog[versionfix];
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
	var language = 'de';
	msg.reply.text(i18n(language, 'botinfo', { botname: botname, version: version, changelog_latest: changelog[versionfix]})).then(function(msg)
					{
                     setTimeout(function(){
                             bot.deleteMessage(msg.chat.id,msg.message_id);
                     }, config.WTdelmsglong);
             });
             bot.deleteMessage(msg.chat.id, msg.message_id);
});

bot.on(/^\/start$/i, (msg) => {
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
		bot.deleteMessage(msg.chat.id, msg.message_id);
		var Para = props.match[1]
		if(typeof(Para) === 'undefined'){
			msg.reply.text("You didn´t provided me with a name... I can´t send you all of them :P");
		}else{
			//console.log(Para)
			perms.permissions(msg.from.id).then(function(Permissions) {
				if(Permissions >= permsJson.regUser){
					//console.log(Permissions);
					vag.Haltestellen(Para).then(function(Haltestellen) {
						if(Haltestellen != 'ENOTFOUND' && Haltestellen != 'ECONNREFUSED' && Haltestellen != 'ETIMEDOUT' && Haltestellen != 'ECONNRESET') {
							var Message = "Stations that contain '" + Para + "':\n\n";
							if(Object.entries(Haltestellen).length === 0){
								msg.reply.text("I´m sorry, i couldn´t find any stations that contain: " + Para + ".");
							}else{
								//console.log(Haltestellen);
								for(var i in Haltestellen){
									let i1 = +i +1;
									var Message = Message + "(" + i1 +") `" + Haltestellen[i].Haltestellenname + "`\n - Ort: " + Haltestellen[i].Ort + "\n - Verkehrsmittel: " + Haltestellen[i].Produkte + "\n\n";
								}
								//console.log(Message);
								if(Message.length >= 4000){
									var Message = 'There are to many Stations that contain ' + Para + '\nFound: ' + Haltestellen.length + ' Stations'
									bot.sendMessage(msg.chat.id, Message, { parseMode: 'markdown', webPreview: false });
								}else{
									bot.sendMessage(msg.chat.id, Message, { parseMode: 'markdown', webPreview: false });
								}
							};
						}else{
							bot.sendMessage(location.from.id, 'An Error happend...', { parseMode: 'markdown', webPreview: false });
							bot.sendMessage(config.LogChat, 'An Error happend.\n' + Haltestellen, { parseMode: 'markdown', webPreview: false });
						}
					})
				}else{
					msg.reply.text("I´m sorry, i´m not allowed to awnser you");
				}
			});
		}
});

bot.on(/^\/abfarten( .+)*$/i, (msg, props) => {
		bot.deleteMessage(msg.chat.id, msg.message_id);
        var Para = props.match[1]
		if(typeof(Para) === 'undefined'){
			msg.reply.text("You didn´t provided me with a name... I can´t send you all of them :P");
		}else{
			perms.permissions(msg.from.id).then(function(Permissions) {
				if(Permissions >= permsJson.regUser){
					//console.log(Permissions);
					vag.Haltestellen(Para).then(function(Haltestellen) {
						if(Haltestellen != 'ENOTFOUND' && Haltestellen != 'ECONNREFUSED' && Haltestellen != 'ETIMEDOUT' && Haltestellen != 'ECONNRESET') {
							var data = {
								limit: 5,
								vgnkennung: Haltestellen[0].VGNKennung,
								mode: 'limitcount', //Static used to auto call Abfarten for eatch element. Currently not implemented
								};
								var Message = "Next " + data.limit + " departures at station '" + Haltestellen[0].Haltestellenname + "':\nOrt: " + Haltestellen[0].Ort + "\n\n";
								if(Object.entries(Haltestellen).length === 0){	
									msg.reply.text("I´m sorry, i couldn´t find any stations that contain: " + Para + ".");
								}else{
									vag.Abfarten(data).then(function(Abfahrten) {
										console.log(Haltestellen[0].VGNKennung);
									
										Abfahrten.map((Abfahrten) =>{
											Message = Message + "(" + Abfahrten.Linienname + ") Direction: " +  Abfahrten.Richtungstext + "\n Gleis: " + Abfahrten.Haltepunkt + " Produkt: " + Abfahrten.Produkt + "\n Abfart: " + Abfahrten.AbfahrtZeitSoll + " (+" + Abfahrten.Verspätung + "s" + ") "
											if(Abfahrten.Prognose){
												Message = Message + " (Echtzeit)\n\n"
											}else{
												Message = Message + " (Prognose)\n\n"
											}
										});
										let replyMarkup = bot.inlineKeyboard([
											[
												bot.inlineButton('Refresh', {callback: 'Update_' + data.vgnkennung})
											]
										]);
										bot.sendMessage(msg.chat.id, Message, { parseMode: 'markdown', webPreview: false , replyMarkup});
										
									});
								};
						}else{
							bot.sendMessage(location.from.id, 'An Error happend...', { parseMode: 'markdown', webPreview: false });
							bot.sendMessage(config.LogChat, 'An Error happend.\n' + Haltestellen, { parseMode: 'markdown', webPreview: false });
						}
					})
				}else{
					msg.reply.text("I´m sorry, i´m not allowed to awnser you");
				}
			});
		}
});



bot.on('location', (location) => {
		perms.permissions(location.from.id).then(function(Permissions) {
		if(Permissions >= permsJson.regUser){
			SQL.requestData(location.from.id).then(function(rows) {
				var Data = {
					lat: location.location.latitude,
					lon: location.location.longitude,
					distance: rows.distance, //Get From DB for User (number in meters)
					sort: rows.sort, //or Alphabetically
					mode: 'count', //Static used to auto call Abfarten for eatch element. Currently not implemented (count/other API Methods)
					para: rows.listlenth, //Get From DB for USER used to auto call Abfarten for eatch element. Currently not implemented (number)
					list: rows.listmode, //Used to either get only closest station or a list of all stations in the radius (closest/list)
				};
				console.log(rows);
				vag.OnLocation(Data).then(function(Haltestellen) {
					if(Haltestellen != 'ENOTFOUND' && Haltestellen != 'ECONNREFUSED' && Haltestellen != 'ETIMEDOUT' && Haltestellen != 'ECONNRESET') {
						var Message = "Stations in radius " + rows.distance + "m :\n\n";
						if(Object.entries(Haltestellen).length === 0){
							bot.sendMessage(location.from.id, "I´m sorry, i couldn´t find any stations in your area.\nDistance: " + Data.distance);
						}else{
							for(let i in Haltestellen){
								let i1 = +i +1;
								var Message = Message + "(" + i1 +") `" + Haltestellen[i].Haltestellenname + "` (" + Haltestellen[i].Distance + "m)" + "\n - Ort: " + Haltestellen[i].Ort + "\n - Verkehrsmittel: " + Haltestellen[i].Produkte + "\n\n";
							};
						}
					bot.sendMessage(location.from.id, Message, { parseMode: 'markdown', webPreview: false });
					}else{
						bot.sendMessage(location.from.id, 'An Error happend...', { parseMode: 'markdown', webPreview: false });
						bot.sendMessage(config.LogChat, 'An Error happend.\n' + Haltestellen, { parseMode: 'markdown', webPreview: false });
					}
				});
			});
		}else{
			msg.reply.text("I´m sorry, i´m not allowed to awnser you");
		}
	});
});

//UserManagment
bot.on(/^\/register/i, (msg) => {
	bot.deleteMessage(msg.chat.id, msg.message_id);
	//console.log(msg.from.username);
	var user = {
		id: msg.from.id,
		name: 'Anonym'
	};
	perms.permissions(msg.from.id).then(function(Permissions) {
		if(Permissions === permsJson.unregUser){
			perms.register(user, function(result) {
				msg.reply.text("You are now registert!");
			});
		}else{
			msg.reply.text("You are already registert\nYour current level is:" + Permissions);
		}
	});
});

bot.on(/^\/unregister/i, (msg) => {
	bot.deleteMessage(msg.chat.id, msg.message_id);
	var user = {
		id: msg.from.id,
		name: msg.from.username
	};
	perms.permissions(msg.from.id).then(function(Permissions) {
		if(Permissions >= permsJson.regUser){
			perms.unregister(user).then(function(result) {
				msg.reply.text("I forgot everything about you...\nResult:\nAffectedRows: " + result.affectedRows,);
			});
		}else{
			msg.reply.text("You are unkown...");
		}
	});
});

bot.on(/^\/promote( .+)*$/i, (msg, props) => {
	bot.deleteMessage(msg.chat.id, msg.message_id);
	var Para = props.match[1]
	if(typeof(Para) === 'undefined'){
		msg.reply.text("You need to specify a new permissions level");
	}else{
		if(!isNaN(Para.trim())){
	perms.permissions(msg.from.id).then(function(Permissions) {
		if(Permissions >= permsJson.Admin){
			if("reply_to_message" in msg){
				perms.permissions(msg.reply_to_message.from.id).then(function(PermissionsReply) {
					if(PermissionsReply >= permsJson.regUserPlus){
					if(PermissionsReply <= Para){
						var user = {
							id: msg.reply_to_message.from.id,
							name: msg.reply_to_message.from.username,
							new: Para,
							old: PermissionsReply
						};
						perms.modify(user).then(function(result) {
							msg.reply.text("Worked");
						});
					}else{
						msg.reply.text("The user has more permissions than you try to give him, please use /demote to do that");
					}
					}else{
						msg.reply.text("This is not possible for that user :(")
					}
				});
			}else{
				msg.reply.text("You need to reply to a user to promote him/her");
			}
		}else{
			msg.reply.text("You don´t have enoth permissions to do this...");
		}
	});
	}else{
		msg.reply.text("You need to give me the permissions as number from 0-40");
	}
	}
});

bot.on(/^\/listusers( .+)*$/i, (msg, props) => {
	var Message = '';
	var AnonymeUsers = '0';
	bot.deleteMessage(msg.chat.id, msg.message_id);
	var Para = props.match[1]
	if(typeof(Para) === 'undefined'){
		Para = '0';
	}
	if(!isNaN(Para.trim())){
	perms.permissions(msg.from.id).then(function(Permissions) {
		if(Permissions >= permsJson.Admin){
			SQL.listall().then(function(list) {
				Message = Message + "Total users " + list.length + ":\n\n"
				list.sort((a, b) => (a.permissions < b.permissions) ? 1 : -1);
				for(i in list){
					//console.log(list[i]);
					if(list[i].permissions >= '2'){
						Message = Message + "(" + list[i].permissions + ") " + list[i].username + "(" + list[i].userid + ")\n"
					}else{
						AnonymeUsers++;
					}
				}
				Message = Message + "\n\Anonyme Users: " + AnonymeUsers
				msg.reply.text(Message);
			});
		}else{
			msg.reply.text("You don´t have enoth permissions to do this...");
		}
	});
		}else{
			msg.reply.text("You need to give me the permissions as number from 0-40");
		}
});

bot.on(/^\/settings/i, (msg) => {
	bot.deleteMessage(msg.chat.id, msg.message_id);
	perms.permissions(msg.from.id).then(function(Permissions) {
		if(Permissions >= permsJson.regUser){
			let replyMarkup = bot.inlineKeyboard([
				[
					bot.inlineButton('User', {callback: 'Settings_User'})
				], [
					bot.inlineButton('On Location', {callback: 'Settings_OnLoc'})
				]
			]);
			msg.reply.text("Here you can customize your experiens\nSettings: ", {parseMode: 'markdown', replyMarkup});
		};
	});
});

//Callback Handling
bot.on('callbackQuery', (msg) => {
	bot.answerCallbackQuery(msg.id);
	
	var chatId = msg.message.chat.id;
	var messageId = msg.message.message_id;
	var data = msg.data.split("_")
	//console.log(msg)
	
	if(data[0] === 'Settings')
	{
		if(data[1] === 'Start')
   		{
			let replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton('User', {callback: 'Settings_User'})
					], [
						bot.inlineButton('On Location', {callback: 'Settings_OnLoc'})
					]
			]);
			bot.editMessageText(
				{chatId: chatId, messageId: messageId}, `Settings:`,
				{parseMode: 'markdown', replyMarkup}
        	).catch(error => console.log('Error:', error));
		}

		if(data[1] === 'User')
   		{
			let replyMarkup = bot.inlineKeyboard([
				[
					bot.inlineButton('Update TelegramID', {callback: 'op_userid'}),
					bot.inlineButton('Language', {callback: 'op_language'})
				], [
					bot.inlineButton('back', {callback: 'Settings_Start'})
				]
			]);
			bot.editMessageText(
				{chatId: chatId, messageId: messageId}, `User Settings:`,
				{parseMode: 'markdown', replyMarkup}
        	).catch(error => console.log('Error:', error));
		}

		if(data[1] === 'OnLoc')
   		{
			let replyMarkup = bot.inlineKeyboard([
				[
					bot.inlineButton('Set GPS Distance', {callback: 'op_nothing'}),
					bot.inlineButton('m', {callback: 'op_switch_distance'})
				], [
					bot.inlineButton('back', {callback: 'Settings_Start'})
				]
			]);
			bot.editMessageText(
				{chatId: chatId, messageId: messageId}, `On Location Settings`,
				{parseMode: 'markdown', replyMarkup}
        	).catch(error => console.log('Error:', error));
		}
	}

	if(data[0] === 'Update') //Update Abfahrten abfrage
	{
		var para = {
			lookup: data[1],
			mode: "VGNKennung"
			};

		LocalDB.lookup(para).then(function(Haltestellen) {
			if(Object.entries(Haltestellen).length === 0){	
				bot.sendMessage(chatId, "I´m sorry, i couldn´t find " + para.lookup + " in my local Buffer, i´ll update it. Please wait ...", { parseMode: 'markdown', webPreview: false});
				LocalDB.updateDB().then(function(Output) {
					bot.sendMessage(chatId, "I´ve updated my local Buffer, please try again now.\n" + Output.Text +  "\nChecked: " + Output.count + " Stations!", { parseMode: 'markdown', webPreview: false});
					bot.sendMessage(config.LogChat, msg.from.username + " requestet a station that didn´t existed in my LocalBufferDB, it got updatet!")
				});
			}else{
			var data = {
				limit: 5,
				vgnkennung: Haltestellen[0].VGNKennung,
				mode: 'limitcount', //Static used to auto call Abfarten for eatch element. Currently not implemented
				};
				var Message = "Next " + data.limit + " departures at station '" + Haltestellen[0].Haltestellenname + "':\nOrt: " + Haltestellen[0].Ort + "\n\n";
					vag.Abfarten(data).then(function(Abfahrten) {
						//console.log(Abfahrten);
					
						Abfahrten.map((Abfahrten) =>{
							Message = Message + "(" + Abfahrten.Linienname + ") Direction: " +  Abfahrten.Richtungstext + "\n Gleis: " + Abfahrten.Haltepunkt + " Produkt: " + Abfahrten.Produkt + "\n Abfart: " + Abfahrten.AbfahrtZeitSoll + " (+" + Abfahrten.Verspätung + "s" + ") "
							if(Abfahrten.Prognose){
								Message = Message + " (Echtzeit)\n\n"
							}else{
								Message = Message + " (Prognose)\n\n"
							}
						});
						let replyMarkup = bot.inlineKeyboard([
							[
								bot.inlineButton('Refresh', {callback: 'Update_' + data.vgnkennung})
							]
						]);
						//bot.sendMessage(chatId, Message, { parseMode: 'markdown', webPreview: false , replyMarkup});
						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, Message,
							{parseMode: 'markdown', replyMarkup}
						).catch(error => console.log('Error:', error));
						
					});
			}
		});
	}
});

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

