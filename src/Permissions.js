var config = require('../config');
var mysql = require('mysql');
var hash = require('hash-int');
var secret = require('../secret');
var perms = require('../data/permissionsList');

var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbreaduserhost,
	user: config.dbreaduser,
	password: secret.dbreaduserpwd,
	database: config.database,
	charset : 'utf8mb4'
});

let permissions = function(userID) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			connection.query('SELECT * FROM users where userhash =' + hash(userID) + ';', function(err, rows, fields) {
				connection.release();
				//console.log(rows);
				if(Object.entries(rows).length === 0){
					resolve("0");
				}else{
					resolve(rows[0].permissions);
				}
			});
		});
	});
}

let modify = function(user) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			let sqlquery = "UPDATE `users` SET `permissions` = '" + user.new.trim() + "' WHERE (`userhash` = '" + hash(user.id) + "') and (`permissions` = '" + user.old + "')"; //Modify Permissions
			connection.query(sqlquery, function(err, result) {
				connection.release();
				//console.log(sqlquery);
				resolve(result);
			});
		});
	});
}

let register = function(user) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			let sqlcmdadduser = "REPLACE INTO users (userhash, userid, username, language, distance, listlenth, listmode, sort, permissions, blocked) VALUES ?";
			let sqlcmdadduserv = [[hash(user.id), 0, user.name, config.DefaultLanguage, config.DefaultDistance, config.DefaultListlenth, config.DefaultListmode, config.DefaultSort, perms.regUser, 0]];
			connection.query(sqlcmdadduser, [sqlcmdadduserv], function(err, result) {
				connection.release();
				//console.log(result);
				resolve(result);
			});
		});
	});
}

let unregister = function(user) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			let sqlcmddeluser = "DELETE FROM users WHERE (`userhash` = '" + hash(user.id) + "');";
			connection.query(sqlcmddeluser, function(err, result) {
				connection.release();
				//console.log(result);
				resolve(result);
			});
		});
	});
}

module.exports = {
	permissions,
	modify,
	register,
	unregister
};