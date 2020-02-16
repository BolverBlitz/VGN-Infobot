const VAGDE = 'https://start.vag.de/dm/api';
const request = require('request');

var config = require('../config');
var mysql = require('mysql');
var secret = require('../secret');

var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbreaduserhost,
	user: config.dbreaduser,
	password: secret.dbreaduserpwd,
	database: config.database,
	charset : 'utf8mb4'
});

let updateDB = function() {
	return new Promise(function(resolve, reject) {
		var url = VAGDE + '/haltestellen.json/vag?name=';
		request(url, { json: true }, (err, res, body) => {
			if (err) { return console.log(err); }
			let sqlcmdadduser = "REPLACE INTO Haltestellen (Haltestellenname, VAGKennung, VGNKennung, Longitude, Latitude, Produkte) VALUES ?";
			db.getConnection(function(err, connection){
				for(i in body.Haltestellen){
					//console.log(body.Haltestellen[i].Haltestellenname)
					let sqlcmdadduserv = [[body.Haltestellen[i].Haltestellenname, body.Haltestellen[i].VAGKennung, body.Haltestellen[i].VGNKennung, body.Haltestellen[i].Longitude, body.Haltestellen[i].Latitude, body.Haltestellen[i].Produkte]];
					connection.query(sqlcmdadduser, [sqlcmdadduserv], function(err, result) {
						if (err) throw err;
						console.log(sqlcmdadduser + " " + sqlcmdadduserv)
					});
				}
				resolve("Done")
			})
		});
	});
}


module.exports = {
	updateDB
};