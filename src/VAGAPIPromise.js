const VAGDE = 'https://start.vag.de/dm/api';
//const VAGDE = 'http://hdjruifjdjrifjfj.de/'; //Error Testing URL
//Include needed jsons
//var config = require('./config');
//var changelog = require('./changelog');

//Include some Funktions
//var f = require('./Funktions');
//getDateTime() Returns german date & time Format
//log() Logs with Time and Date
//getRandomInt(max)
//uptime(Time_started)

const geolib = require('geolib');

//Include simple modules
const request = require('request');
var fs = require("fs");
const util = require('util');
const hash = require('hash-int');
//const newI18n = require('new-i18n');
//const i18n = newI18n(__dirname + '/languages', ['en', 'de']);

//Für Zeit Befehle
var Sekunde = 1000;
var Minute = Sekunde*60;
var Stunde = Minute*60;
var Tag = Stunde*24;
var Monat = Tag*(365/12);
var Jahr = Tag*365;

let Haltestellen = function(Name) {
	return new Promise(function(resolve, reject) {
		//https://start.vag.de/dm/api/haltestellen.json/vag?lon=11.06464&lat=49.4484830
		var url = VAGDE + '/haltestellen.json/vgn?name=' + urlReformat(Name.trim());
		request(url, { json: true }, (err, res, body) => {
			if (err) { return console.log(err); }
			//var Temp = JSON.stringify(body.Haltestellen);
			for(i in body.Haltestellen){
				let HaltestellennameSplit = body.Haltestellen[i].Haltestellenname.split("(");
				let Name = HaltestellennameSplit[0];
				body.Haltestellen[i].Haltestellenname = Name.trim();
				let Ort = HaltestellennameSplit[1].replace(/[)]/g,'',);
				body.Haltestellen[i].Ort = Ort;
				body.Haltestellen[i].Produkte = body.Haltestellen[i].Produkte.replace(/ubahn/i,'U-Bahn',);
				body.Haltestellen[i].Produkte = body.Haltestellen[i].Produkte.replace(/,/g,', ',);
			}
			//console.log(body.Haltestellen);
			resolve(body.Haltestellen);
  
		});
	});
}

let OnLocation = function(data) {
	return new Promise(function(resolve, reject) {
	var url = VAGDE + '/haltestellen.json/vgn?lon=' + data.lon + '&lat=' + data.lat + '&Distance=' + data.distance;
	request(url, { json: true }, (err, res, body) => {
		if (err) { 
		//return console.log(err);
		resolve(err.code);		
		return err; 
		//reject(err);
		}
			for(let i in body.Haltestellen){
				body.Haltestellen[i].Distance = geolib.getDistance(
					{ latitude: data.lat, longitude: data.lon },
					{ latitude: body.Haltestellen[i].Latitude, longitude: body.Haltestellen[i].Longitude }
				);
				let HaltestellennameSplit = body.Haltestellen[i].Haltestellenname.split("(");
				let Name = HaltestellennameSplit[0];
				body.Haltestellen[i].Haltestellenname = Name.trim();
				let Ort = HaltestellennameSplit[1].replace(/[)]/g,'',);
				body.Haltestellen[i].Ort = Ort;
				body.Haltestellen[i].Produkte = body.Haltestellen[i].Produkte.replace(/ubahn/i,'U-Bahn',);
				body.Haltestellen[i].Produkte = body.Haltestellen[i].Produkte.replace(/,/g,', ',);
			}
		if(data.sort === 'Distance'){body.Haltestellen.sort((a, b) => (a.Distance > b.Distance) ? 1 : -1)};
		if(data.sort === 'Alphabetically'){body.Haltestellen.sort((a, b) => (a.Haltestellenname > b.Haltestellenname) ? 1 : -1)};
	//resolve(Test)
		resolve(body.Haltestellen);
		});
});

}

let Abfarten = function(data) {
	return new Promise(function(resolve, reject) {
		
	});
}

//exports.Haltestellen = Haltestellen;

function urlReformat(value)
{
    value = value.replace(/ä/g, '%C3%A4');
    value = value.replace(/ö/g, '%C3%B6');
    value = value.replace(/ü/g, '%C3%BC');
    return value;
}

module.exports = {
	Haltestellen,
	OnLocation
};