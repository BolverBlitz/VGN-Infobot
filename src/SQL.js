var config = require("../config");
var mysql = require("mysql");
const hash = require("hash-int");
var secret = require("../secret");

var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbreaduserhost,
	user: config.dbreaduser,
	password: secret.dbreaduserpwd,
	database: config.database,
	charset : 'utf8mb4'
});

let requestData = function(userID) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			connection.query('SELECT * FROM users where userhash =' + hash(userID) + ';', function(err, rows, fields) {
				connection.release();
				//console.log(rows);
				if(Object.entries(rows).length === 0){
					resolve("0");
				}else{
					resolve(rows[0]);
				}
			});
		});
	});
}

let listall = function() {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			connection.query('SELECT * FROM vaginfo.users;', function(err, rows, fields) {
				connection.release();
				//console.log(rows);
				if(Object.entries(rows).length === 0){
					resolve("0");
				}else{
					resolve(rows);
				}
			});
		});
	});
}

module.exports = {
	requestData,
	listall
};