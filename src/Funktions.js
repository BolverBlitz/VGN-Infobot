//Include simple modules
var fs = require("fs");
const util = require('util');
const mysql = require('mysql'); 
const hash = require('hash-int');

//Für Zeit Befehle
var Sekunde = 1000;
var Minute = Sekunde*60;
var Stunde = Minute*60;
var Tag = Stunde*24;
var Monat = Tag*(365/12);
var Jahr = Tag*365;

module.exports = {
	getDateTime: function getDateTime(date) {

		var hour = date.getHours();
		hour = (hour < 10 ? "0" : "") + hour;

		var min  = date.getMinutes();
		min = (min < 10 ? "0" : "") + min;

		var sec  = date.getSeconds();
		sec = (sec < 10 ? "0" : "") + sec;

		var year = date.getFullYear();

		var month = date.getMonth() + 1;
		month = (month < 10 ? "0" : "") + month;

		var day  = date.getDate();
		day = (day < 10 ? "0" : "") + day;

		return day + "." + month + "." + year + " " + hour + ":" + min + ":" + sec;
	},
	log: function log(info) {
		console.log(getDateTimelog(new Date()) + " " + info)
	},
	
	getRandomInt: function getRandomInt(max) {
		return Math.floor(Math.random() * Math.floor(max));
	},
	uptime: function uptime(Time_started) {
		var uptime = new Date().getTime() - Time_started;
	
		var uptimeTage =  Math.floor((uptime)/Tag);
		var uptimeTageRest = uptime-(uptimeTage*Tag)
	
		var uptimeStunde =  Math.floor((uptimeTageRest)/Stunde);
		var uptimeStundeRest = uptimeTageRest-(uptimeStunde*Stunde)
	
		var uptimeMinute =  Math.floor((uptimeStundeRest)/Minute);
		var uptimeMinuteRest = uptimeStundeRest-(uptimeMinute*Minute)
	
		var uptimeSekunde =  Math.floor((uptimeMinuteRest)/Sekunde);
		var uptimeSekundeRest = uptimeMinuteRest-(uptimeSekunde*Sekunde)
	
		let uptimeoutput = "\nSekunden: " + uptimeSekunde;
		if(uptimeMinute >= 1){
		uptimeoutput = "\nMinuten: " + uptimeMinute + uptimeoutput;
		}
		if(uptimeStunde >= 1){
		uptimeoutput = "\nStunden: " + uptimeStunde + uptimeoutput;
		}
		if(uptimeTage >= 1){
		uptimeoutput = "\nTage: " + uptimeTage + uptimeoutput;
		}
		return uptimeoutput;
	},
	Round2Dec: function Round2Dec(num){
		return Math.round(num * 100) / 100
	}
};

function getDateTimelog(date) {

		var hour = date.getHours();
		hour = (hour < 10 ? "0" : "") + hour;

		var min  = date.getMinutes();
		min = (min < 10 ? "0" : "") + min;

		var sec  = date.getSeconds();
		sec = (sec < 10 ? "0" : "") + sec;

		var year = date.getFullYear();

		var month = date.getMonth() + 1;
		month = (month < 10 ? "0" : "") + month;

		var day  = date.getDate();
		day = (day < 10 ? "0" : "") + day;

		return "[" + day + "." + month + "." + year + "] [" + hour + ":" + min + ":" + sec + "]";

}