const VAGDE = "https://start.vag.de/dm/api";
const request = require("request");

var config = require("../config");
var mysql = require("mysql");
var secret = require("../secret");

var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbreaduserhost,
	user: config.dbreaduser,
	password: secret.dbreaduserpwd,
	database: config.database,
	charset : "utf8mb4"
});

function cleanString(input) {
    var output = "";
    for (var i=0; i<input.length; i++) {
        if (input.charCodeAt(i) <= 127) {
            output += input.charAt(i);
        }
    }
    return output;
}

let updateDB = function() {
	return new Promise(function(resolve, reject) {
		var url = VAGDE + "/haltestellen.json/vag?name=";
		let sqlcmdadduser = "REPLACE INTO Haltestellen (Haltestellenname, Ort, VAGKennung, VGNKennung, Longitude, Latitude, Produkte) VALUES ?";
		request(url, { json: true }, (err, res, body) => {
			if (err) { throw err; }
			db.getConnection(function(err, connection){
				let out = {
					Text: "Updated finished!",
					count: 0
					};
					//console.log(body.Haltestellen)
					body.Haltestellen.map((Haltestellen) => {
						out.count = out.count + 1;
						let HaltestellennameSplit = Haltestellen.Haltestellenname.split("(");
						let Name = HaltestellennameSplit[0];
						Haltestellen.Haltestellenname = Name.trim();
						let Ort = HaltestellennameSplit[1].replace(/[)]/g,"",);
						Haltestellen.Ort = Ort;

						//Haltestellen.Produkte = Haltestellen.Produkte.replace(/ubahn/i,"U-Bahn",);
						//Haltestellen.Produkte = Haltestellen.Produkte.replace(/,/g,", ",);

						let sqlcmdadduserv = [[Haltestellen.Haltestellenname, Haltestellen.Ort, Haltestellen.VAGKennung, Haltestellen.VGNKennung, Haltestellen.Longitude, Haltestellen.Latitude, Haltestellen.Produkte]];
						connection.query(sqlcmdadduser, [sqlcmdadduserv], function(err, result) {
							if (err) { throw err; }
						});
					});
					connection.release();
					resolve(out);
			});
		});
	});
};

let lookup = function(para) {
	return new Promise(function(resolve, reject) {
		if(para.mode === "LIKE"){var sqlcmd = "SELECT Haltestellenname,VGNKennung,Ort,Produkte FROM Haltestellen where " + para.collum + " LIKE '%" + cleanString(para.lookup.trim()) + "%' LIMIT " + para.limit;}
		if(para.mode === "EQUEL"){var sqlcmd = "SELECT Haltestellenname,VGNKennung,Ort FROM Haltestellen where " + para.collum + " ='" + para.lookup.trim() + "' LIMIT " + para.limit;}
		console.log(sqlcmd)
		db.getConnection(function(err, connection){
			connection.query(sqlcmd, function(err, rows){
				if (err) { throw err; }
				connection.release();
				resolve(rows);
			});
		});
	});
}


module.exports = {
	updateDB,
	lookup
};