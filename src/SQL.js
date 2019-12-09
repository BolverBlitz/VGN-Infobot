var config = require('../config');
var mysql = require('mysql');
const hash = require('hash-int');
var secret = require('../secret');

var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbreaduserhost,
	user: config.dbreaduser,
	password: secret.dbreaduserpwd,
	database: config.database,
	charset : 'utf8mb4'
});

module.exports = {
	requestData: function requestData(userID, callback) {
		console.log(secret.dbreaduserpwd)
	db.getConnection(function(err, connection){
		connection.query('SELECT * FROM users where userhash =' + hash(userID) + ';', function(err, rows, fields) {
			//console.log(rows);
			if(Object.entries(rows).length === 0){
				callback("0");
			}else{
			callback(rows[0]);
			}
		});
	});
	}
}