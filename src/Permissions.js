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
	permissions: function permissions(userID, callback) {
	db.getConnection(function(err, connection){
		connection.query('SELECT * FROM users where userhash =' + hash(userID) + ';', function(err, rows, fields) {
			//console.log(rows);
			if(Object.entries(rows).length === 0){
				callback("0");
			}else{
			callback(rows[0].permissions);
			}
		});
	});
	},
	register: function register(user, callback) {
	db.getConnection(function(err, connection){
		let sqlcmdadduser = "REPLACE INTO users (userhash, userid, username, language, distance, sort, permissions, blocked) VALUES ?";
		let sqlcmdadduserv = [[hash(user.id), 0, user.name, config.DefaultLanguage, config.DefaultDistance, config.DefaultSort, 1, 0]];
		connection.query(sqlcmdadduser, [sqlcmdadduserv], function(err, result) {
			console.log(result);
			callback(result);
			});
		});
	},
	unregister: function unregister(user, callback) {
	db.getConnection(function(err, connection){
		let sqlcmddeluser = "DELETE FROM users WHERE (`userhash` = '" + hash(user.id) + "');";
		connection.query(sqlcmddeluser, function(err, result) {
			//console.log(result);
			callback(result);
			});
		});
	}
}