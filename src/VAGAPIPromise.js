const VAGDE = "https://start.vag.de/dm/api";

const geolib = require("geolib");

//Include simple modules
const request = require("request");
var fs = require("fs");
const util = require("util");
const hash = require("hash-int");


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
		var url = VAGDE + "/haltestellen.json/vgn?name=" + urlReformat(Name.trim());
		request(url, { json: true }, (err, res, body) => {
			if (err) { return console.log(err); }
			//var Temp = JSON.stringify(body.Haltestellen);
			for(i in body.Haltestellen){
				let HaltestellennameSplit = body.Haltestellen[i].Haltestellenname.split("(");
				let Name = HaltestellennameSplit[0];
				body.Haltestellen[i].Haltestellenname = Name.trim();
				let Ort = HaltestellennameSplit[1].replace(/[)]/g,"",);
				body.Haltestellen[i].Ort = Ort;
				body.Haltestellen[i].Produkte = body.Haltestellen[i].Produkte.replace(/ubahn/i,"U-Bahn",);
				body.Haltestellen[i].Produkte = body.Haltestellen[i].Produkte.replace(/,/g,", ",);
			}
			//console.log(body.Haltestellen);
			resolve(body.Haltestellen);
  
		});
	});
}

let OnLocation = function(data) {
	return new Promise(function(resolve, reject) {
	var url = VAGDE + "/haltestellen.json/vgn?lon=" + data.lon + "&lat=" + data.lat + "&Distance=" + data.distance;
	request(url, { json: true }, (err, res, body) => {
		if (err) { 
		//return console.log(err);
		resolve(err.code);		
		return err; 
		//reject(err);
		}
			body.Haltestellen.map((Haltestellen) => {
			//for(let i in body.Haltestellen){
				Haltestellen.Distance = geolib.getDistance(
					{ latitude: data.lat, longitude: data.lon },
					{ latitude: Haltestellen.Latitude, longitude: Haltestellen.Longitude }
				);
				let HaltestellennameSplit = Haltestellen.Haltestellenname.split("(");
				let Name = HaltestellennameSplit[0];
				Haltestellen.Haltestellenname = Name.trim();
				let Ort = HaltestellennameSplit[1].replace(/[)]/g,"",);
				Haltestellen.Ort = Ort;
				//Haltestellen.Produkte = Haltestellen.Produkte.replace(/ubahn/i,"U-Bahn",);
				//Haltestellen.Produkte = Haltestellen.Produkte.replace(/,/g,", ",);
			});
		if(data.sort === "Distance"){body.Haltestellen.sort((a, b) => (a.Distance > b.Distance) ? 1 : -1)};
		if(data.sort === "Alphabetically"){body.Haltestellen.sort((a, b) => (a.Haltestellenname > b.Haltestellenname) ? 1 : -1)};
	//resolve(Test)
		resolve(body.Haltestellen);
		});
});

}

let Abfarten = function(data) {
	return new Promise(function(resolve, reject) {
		if(data.mode === "produkt"){var url = VAGDE + "/abfahrten.json/vgn/" + data.vgnkennung + "?produkt=" + data.produkt + "&LimitCount=" + data.limit}
		if(data.mode === "timespan"){var url = VAGDE + "/abfahrten.json/vgn/" + data.vgnkennung + "?TimeSpan=" + data.timespan + "&LimitCount=" + data.limit}
		if(data.mode === "timedelay"){var url = VAGDE + "/abfahrten.json/vgn/" + data.vgnkennung + "?TimeDelay=" + data.timedelay + "&LimitCount=" + data.limit}
		if(data.mode === "limitcount"){var url = VAGDE + "/abfahrten.json/vgn/" + data.vgnkennung + "?LimitCount=" + data.limit}
		request(url, { json: true }, (err, res, body) => {
			if (err) { 
			//return console.log(err);
			resolve(err.code);		
			return err; 
			//reject(err);
			}

			//if(Object.entries(body.Abfahrten).length === 0){

			//console.log(body)
			body.Abfahrten.map((Abfahrten) =>{
				AbfahrtZeitSollArray = Abfahrten.AbfahrtszeitSoll;
				AbfahrtZeitSollArray = AbfahrtZeitSollArray.split("+");
				AbfahrtZeitSollArray = AbfahrtZeitSollArray[0].split("T");
				AbfahrtZeitSollArrayDatum = AbfahrtZeitSollArray[0].split("-");
				AbfahrtZeitSollArrayZeit = AbfahrtZeitSollArray[1].split(":");
				AbfahrtZeitSollArrayDatum = AbfahrtZeitSollArrayDatum[1] + "/" + AbfahrtZeitSollArrayDatum[2] + "/" + AbfahrtZeitSollArrayDatum[0]
				AbfahrtZeitSollArrayZeitUnix = new Date(AbfahrtZeitSollArrayDatum).getTime() + AbfahrtZeitSollArrayZeit[0] * 60 * 60 * 1000 + AbfahrtZeitSollArrayZeit[1] * 60 * 1000 + AbfahrtZeitSollArrayZeit[2] * 1000 + 60 * 60 * 1000

				AbfahrtZeitIstArray = Abfahrten.AbfahrtszeitIst;
				AbfahrtZeitIstArray = AbfahrtZeitIstArray.split("+");
				AbfahrtZeitIstArray = AbfahrtZeitIstArray[0].split("T");
				AbfahrtZeitIstArrayDatum = AbfahrtZeitIstArray[0].split("-");
				AbfahrtZeitIstArrayZeit = AbfahrtZeitIstArray[1].split(":");
				AbfahrtZeitIstArrayDatum = AbfahrtZeitIstArrayDatum[1] + "/" + AbfahrtZeitIstArrayDatum[2] + "/" + AbfahrtZeitIstArrayDatum[0]
				AbfahrtZeitIstArrayZeitUnix = new Date(AbfahrtZeitIstArrayDatum).getTime() + AbfahrtZeitIstArrayZeit[0] * 60 * 60 * 1000 + AbfahrtZeitIstArrayZeit[1] * 60 * 1000 + AbfahrtZeitIstArrayZeit[2] * 1000 + 60 * 60 * 1000
										
				Abfahrten.AbfahrtZeitSoll = AbfahrtZeitSollArray[1]
				Abfahrten.Verspätung = (AbfahrtZeitIstArrayZeitUnix - AbfahrtZeitSollArrayZeitUnix)/1000
			});
			resolve(body.Abfahrten);
		});
		//https://start.vag.de/dm/api/abfahrten.json/vgn/1664?timedelay=60&LimitCount=2
	});
}

//exports.Haltestellen = Haltestellen;

function urlReformat(value)
{
    value = value.replace(/ä/g, "%C3%A4");
    value = value.replace(/ö/g, "%C3%B6");
    value = value.replace(/ü/g, "%C3%BC");
    return value;
}

module.exports = {
	Haltestellen,
	OnLocation,
	Abfarten
};