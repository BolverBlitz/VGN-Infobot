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
	console.log(msg)
	if(msg.chat.type != "private")
	{
		
		if(msg.text.split(' ')[0].endsWith(botname))
		{
		let startmsg = "Privat";
		msg.reply.text(startmsg).then(function(msg)
	                        {
	                                setTimeout(function(){
	                                        bot.deleteMessage(msg.chat.id,msg.message_id);
	                                }, config.WTdelmsglong);
	                        });
		bot.deleteMessage(msg.chat.id, msg.message_id);
		}
	}else{
		let startmsg = "Privat";
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
									var Message = Message + "(" + i1 +") `" + Haltestellen[i].Haltestellenname + "`\n - Ort: " + Haltestellen[i].Ort + "\n - Verkehrsmittel: " + replaceProdukteWithEmotes(Haltestellen[i].Produkte) + "\n\n";
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
											Message = Message + "(" + Abfahrten.Linienname + ") Direction: " +  Abfahrten.Richtungstext + "\n Gleis: " + Abfahrten.Haltepunkt + " Produkt: " + replaceProdukteWithEmotes(Abfahrten.Produkt) + "\n Abfart: " + Abfahrten.AbfahrtZeitSoll + " (+" + Abfahrten.Verspätung + "s" + ") "
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
				//console.log(location);
				vag.OnLocation(Data).then(function(Haltestellen) {
					if(Haltestellen != 'ENOTFOUND' && Haltestellen != 'ECONNREFUSED' && Haltestellen != 'ETIMEDOUT' && Haltestellen != 'ECONNRESET') {
						var Message = "Stations in radius " + rows.distance + "m :\n\n";
						if(Object.entries(Haltestellen).length === 0){
							bot.sendMessage(location.from.id, "I´m sorry, i couldn´t find any stations in your area.\nDistance: " + Data.distance);
						}else{
							for(let i in Haltestellen){
								let i1 = +i +1;
								var Message = Message + "(" + i1 +") `" + Haltestellen[i].Haltestellenname + "` (" + Haltestellen[i].Distance + "m)" + "\n - Ort: " + Haltestellen[i].Ort + "\n - Verkehrsmittel: " + replaceProdukteWithEmotes(Haltestellen[i].Produkte) + "\n\n";
							};
						}
					bot.sendMessage(location.chat.id, Message, { parseMode: 'markdown', webPreview: false });
					}else{
						bot.sendMessage(location.chat.id, 'An Error happend...', { parseMode: 'markdown', webPreview: false });
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
			perms.register(user).then(function(result) {
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
					bot.inlineButton('User', {callback: 'Settings_' + msg.from.id + '_User'})
				], [
					bot.inlineButton('On Location', {callback: 'Settings_' + msg.from.id + '_OnLoc'})
				]
			]);
			msg.reply.text("Here you can customize your experiens\nSettings for " + msg.from.first_name + ":", {parseMode: 'markdown', replyMarkup});
		}else{
			msg.reply.text("Your need to be registert to do that.")
		}
	});
});

//Callback Handling
//Pattern is "Menü_USERID_Wert"
bot.on('callbackQuery', (msg) => {
	/*bot.answerCallbackQuery(msg.id,{
		text: "Test",
		showAlert: true
	});*/
	
	console.log(msg.data)
	if ('inline_message_id' in msg){
	//if(Object.entries(msg.inline_message_id).length === 1){	
		var inlineId = msg.inline_message_id;
	}else{
		var chatId = msg.message.chat.id;
		var messageId = msg.message.message_id;
	}

	var data = msg.data.split("_")
	console.log(msg.data)
	
	if(data[0] === 'Settings')
	{
		SQL.requestData(msg.from.id).then(function(user) {

			if(parseInt(data[1]) === msg.from.id){

				if(data[2] === 'Start')
				{
					bot.answerCallbackQuery(msg.id);
					let replyMarkup = bot.inlineKeyboard([
							[
								bot.inlineButton('User', {callback: 'Settings_' + data[1] + '_User'})
							], [
								bot.inlineButton('On Location', {callback: 'Settings_' + data[1] + '_OnLoc'})
							]
					]);
					bot.editMessageText(
						{chatId: chatId, messageId: messageId}, "Settings for " + msg.from.first_name + ":",
						{parseMode: 'markdown', replyMarkup}
					).catch(error => console.log('Error:', error));
				}

				if(data[2] === 'User')
				{
					bot.answerCallbackQuery(msg.id);
					if(user.userid === 0){
						let replyMarkup = bot.inlineKeyboard([ //If TG ID is set, chance to remove TelegramID
							[
								bot.inlineButton('Update TelegramID', {callback: 'op_' + data[1] + '_userid'}),
								bot.inlineButton('Language ' + user.language, {callback: 'op_' + data[1] + '_language'})
							], [
								bot.inlineButton('back', {callback: 'Settings_' + data[1] + '_Start'})
							]
						]);

						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, "User Settings for " + msg.from.first_name + ":\nPlease click on the buttos to change the value the buttons respont to.",
							{parseMode: 'markdown', replyMarkup}
						).catch(error => console.log('Error:', error));
					}else{
						let replyMarkup = bot.inlineKeyboard([ //If TG ID is set, chance to remove TelegramID
							[
								bot.inlineButton('Delete TelegramID', {callback: 'op_' + data[1] + '_deluserid'}),
								bot.inlineButton('Language ' + user.language, {callback: 'op_' + data[1] + '_language'})
							], [
								bot.inlineButton('back', {callback: 'Settings_' + data[1] + '_Start'})
							]
						]);

						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, "User Settings for " + msg.from.first_name + ":",
							{parseMode: 'markdown', replyMarkup}
						).catch(error => console.log('Error:', error));
					}
				}

				if(data[2] === 'OnLoc')
				{
					bot.answerCallbackQuery(msg.id);
					let replyMarkup = bot.inlineKeyboard([
						[
							bot.inlineButton('Set GPS Distance', {callback: 'op_' + data[1] + '_nothing'}),
							bot.inlineButton('m', {callback: 'op_' + data[1] + '_switch_distance'})
						], [
							bot.inlineButton('back', {callback: 'Settings_' + data[1] + '_Start'})
						]
					]);
					bot.editMessageText(
						{chatId: chatId, messageId: messageId}, "On Location Settings for " + msg.from.first_name + ":",
						{parseMode: 'markdown', replyMarkup}
					).catch(error => console.log('Error:', error));
				}
			}else{
				bot.answerCallbackQuery(msg.id,{
					text: "Du darfst hier nicht drücken!",
					showAlert: true
				});
			}
		});
	}

	if(data[0] === 'op')
	{
		SQL.requestData(msg.from.id).then(function(user) {
			if(parseInt(data[1]) === msg.from.id){
				if(data[2] === 'userid')
				{
					let para = {
						id: msg.from.id,
						collum: 'userid',
						valuenew: msg.from.id,
						valueold: '0',
					}
					SQL.updateUser(para).then(function(response) {
						var userUpdate = {
							id: msg.from.id,
							name: msg.from.username,
							new: "2",
							old: "1"
						};
						perms.toLeveltwo(userUpdate).then(function(result) {
							bot.answerCallbackQuery(msg.id,{
								text: "Deine TelegramID: " + msg.from.id + " wrude gespeichert.\n Du bist nun Level 2",
								showAlert: true
							});
							let replyMarkup = bot.inlineKeyboard([ //If TG ID is set, chance to remove TelegramID
								[
									bot.inlineButton('Delete TelegramID', {callback: 'op_' + data[1] + '_deluserid'}),
									bot.inlineButton('Language ' + user.language, {callback: 'op_' + data[1] + '_language'})
								], [
									bot.inlineButton('back', {callback: 'Settings_' + data[1] + '_Start'})
								]
							]);
							bot.editMessageText(
								{chatId: chatId, messageId: messageId}, "User Settings for " + msg.from.first_name + ":",
								{parseMode: 'markdown', replyMarkup}
							).catch(error => console.log('Error:', error));

						}).catch(error => console.log('Error:', error));
					}).catch(function(error) {
						console.log(error)
						bot.answerCallbackQuery(msg.id,{
							text: "Du hast deine ID bereits gespeichert.",
							showAlert: true
						});
					})
				}
				if(data[2] === 'deluserid')
				{
					let para = {
						id: msg.from.id,
						collum: 'userid',
						valuenew: '0',
						valueold: msg.from.id,
					}
					SQL.updateUser(para).then(function(response) {
						var userUpdate = {
							id: msg.from.id,
							name: "Anonym",
							new: "1",
							old: "2"
						};
						perms.toLeveltwo(userUpdate).then(function(result) {
							bot.answerCallbackQuery(msg.id,{
								text: "Deine TelegramID: " + msg.from.id + " wrude gelöscht.\n Du bist nun Level 1",
								showAlert: true
							});
							let replyMarkup = bot.inlineKeyboard([ //If TG ID is set, chance to remove TelegramID
								[
									bot.inlineButton('Update TelegramID', {callback: 'op_' + data[1] + '_userid'}),
									bot.inlineButton('Language ' + user.language, {callback: 'op_' + data[1] + '_language'})
								], [
									bot.inlineButton('back', {callback: 'Settings_' + data[1] + '_Start'})
								]
							]);
							bot.editMessageText(
								{chatId: chatId, messageId: messageId}, "User Settings for " + msg.from.first_name + ":",
								{parseMode: 'markdown', replyMarkup}
							).catch(error => console.log('Error:', error));
							
						}).catch(error => console.log('Error:', error));
					}).catch(function(error) {
						console.log(error)
						bot.answerCallbackQuery(msg.id,{
							text: "Du hast deine ID bereits gelöscht.",
							showAlert: true
						});
					})
				}

				if(data[2] === 'language')
				{
						let lang = i18n.languages
						let position = lang.indexOf(user.language.toLowerCase())
						let positionOLD = position
						position = position + 1;
						if(position > lang.length-1){position = 0}

						let para = {
							id: msg.from.id,
							collum: 'language',
							valuenew: lang[position].toUpperCase(),
							valueold: lang[positionOLD].toUpperCase(),
						}
						SQL.updateUser(para).then(function(response) {
							if(user.userid === 0){
								let replyMarkup = bot.inlineKeyboard([ //If TG ID is set, chance to Update TelegramID
									[
										bot.inlineButton('Update TelegramID', {callback: 'op_' + data[1] + '_userid'}),
										bot.inlineButton('Language ' + lang[position].toUpperCase(), {callback: 'op_' + data[1] + '_language'})
									], [
										bot.inlineButton('back', {callback: 'Settings_' + data[1] + '_Start'})
									]
								]);
		
								bot.editMessageText(
									{chatId: chatId, messageId: messageId}, "User Settings for " + msg.from.first_name + ":\nPlease click on the buttos to change the value the buttons respont to.",
									{parseMode: 'markdown', replyMarkup}
								).catch(error => console.log('Error:', error));
								bot.answerCallbackQuery(msg.id);
							}else{
								let replyMarkup = bot.inlineKeyboard([ //If TG ID is set, chance to remove TelegramID
									[
										bot.inlineButton('Delete TelegramID', {callback: 'op_' + data[1] + '_deluserid'}),
										bot.inlineButton('Language ' + lang[position].toUpperCase(), {callback: 'op_' + data[1] + '_language'})
									], [
										bot.inlineButton('back', {callback: 'Settings_' + data[1] + '_Start'})
									]
								]);
		
								bot.editMessageText(
									{chatId: chatId, messageId: messageId}, "User Settings for " + msg.from.first_name + ":",
									{parseMode: 'markdown', replyMarkup}
								).catch(error => console.log('Error:', error));
								bot.answerCallbackQuery(msg.id);
							}
						});
				}
			}else{
				bot.answerCallbackQuery(msg.id,{
					text: "Du darfst hier nicht drücken!",
					showAlert: true
				});
			}
		});
	}

	if(data[0] === 'Update') //Update Abfahrten abfrage
	{
		perms.permissions(msg.from.id).then(function(Permissions) {
			if(Permissions >= permsJson.regUser){

				bot.answerCallbackQuery(msg.id,{
					text: "Abfarten wurden aktualisiert...",
					showAlert: false
				});

				var para = {
					lookup: data[1],
					collum: "VGNKennung",
					mode: "EQUEL",
					limit: 1
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
									Message = Message + "(" + Abfahrten.Linienname + ") Direction: " +  Abfahrten.Richtungstext + "\n Gleis: " + Abfahrten.Haltepunkt + " Produkt: " + replaceProdukteWithEmotes(Abfahrten.Produkt) + "\n Abfart: " + Abfahrten.AbfahrtZeitSoll + " (+" + Abfahrten.Verspätung + "s" + ") "
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

								//console.log(Message)
								if ('inline_message_id' in msg) {
									bot.editMessageText(
										{inlineMsgId: inlineId}, Message,
										{parseMode: 'markdown', replyMarkup}
									).catch(error => console.log('Error:', error));
								}else{
									bot.editMessageText(
										{chatId: chatId, messageId: messageId}, Message,
										{parseMode: 'markdown', replyMarkup}
									).catch(error => console.log('Error:', error));
								}
								
							});
					}
				});
			}else{
				bot.answerCallbackQuery(msg.id,{
					text: "Diese Funktion ist nur für regestrierte nutzer.",
					showAlert: true
				});
			}
		});
	}
});

bot.on('inlineQuery', msg => {

    let query = msg.query;
	const answers = bot.answerList(msg.id, {cacheTime: 1});
	
	var para = {
		lookup: query,
		collum: "Haltestellenname",
		mode: "LIKE",
		limit: 10
		};

	LocalDB.lookup(para).then(function(Haltestellen) {
		let idcount = 0;
		if(Object.entries(Haltestellen).length === 0){
			answers.addArticle({
				id: 'Not found',
				title: 'No station found',
				description: query,
				message_text: ("I´m sorry, i couln´t find any stations containing " + query)
			});
			return bot.answerQuery(answers);
		}else{
			Haltestellen.map((Haltestellen) => {

				let replyMarkup = bot.inlineKeyboard([
					[
						bot.inlineButton('Depatures', {callback: 'Update_' + Haltestellen.VGNKennung,})
					]
				]);

				let MessageOut = "`" + Haltestellen.Haltestellenname + "`\n - Ort: " + Haltestellen.Ort + "\n - Verkehrsmittel: " + replaceProdukteWithEmotes(Haltestellen.Produkte) + "\n";

				answers.addArticle({
					id: idcount,
					title: Haltestellen.Haltestellenname,
					description: Haltestellen.Ort + " " + replaceProdukteWithEmotes(Haltestellen.Produkte),
					reply_markup: replyMarkup,
					message_text: MessageOut,
					//message_text: "Test",
					parse_mode: 'markdown'
				});
				idcount++;
			});
			return bot.answerQuery(answers);
		}
	}).catch(error => console.log('Error:', error));
});

//Funktions

function replaceProdukteWithEmotes(string){
	var Input = string.split(",");
	let Output = "";
	Input.map((In) => {
		if(In.trim() === "Bus"){Output += "🚌 "};
		if(In.trim() === "Tram"){Output += "🚃 "};
		if(In.trim() === "UBahn"){Output += "🚇 "};
	});
	return(Output);
}

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

