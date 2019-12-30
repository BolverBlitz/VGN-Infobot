var config = require('./config');
var perms = require('./data/permissionsList');
var mysql = require('mysql');
const hash = require('hash-int');
var secret = require('./secret');
if(config.dbreaduserhost == "example.com"){
	console.log("I´m sorry. You need to fill out config.json first!");
}else{
var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbreaduserhost,
	user: config.dbreaduser,
	password: secret.dbreaduserpwd,
	charset : 'utf8mb4'
});
//MySQL Syntax
let sqlcmd = "CREATE DATABASE IF NOT EXISTS " + config.database + ";";
let sqlcmdtable = "CREATE TABLE IF NOT EXISTS `users` (`userhash` DOUBLE NOT NULL,`userid` DOUBLE NOT NULL, `username` varchar(255), `language` varchar(255), `distance` varchar(255), `listlenth` varchar(255), `listmode` varchar(255), `sort` varchar(255), `permissions` DOUBLE NOT NULL, `keywords` varchar(255), `blocked` DOUBLE NOT NULL, `time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`userid`,`permissions`));";
let sqlcmdaddsuperadmin = "REPLACE INTO users (userhash, userid, username, language, distance,listlenth, listmode, sort, permissions, blocked) VALUES ?";
let sqlcmdaddsuperadminvalues = [[hash(config.isSuperAdmin), config.isSuperAdmin, config.isSuperAdminUsername, config.DefaultLanguage, config.DefaultDistance, config.DefaultListlenth, config.DefaultListmode, config.DefaultSort, perms.Admin, 0]];
/*
Permissions:
Check ./data/permissionsList.json
*/

//Create DB
db.getConnection(function(err, connection){
	console.log("Connected to " + config.dbreaduserhost);
	connection.query(sqlcmd, function(err, result){
                if(err) throw err;
				console.log("Database " + config.database + " created");
                });
                connection.release();
});
//Create Table
db.getConnection(function(err, connection){
	connection.query("USE " + config.database + ";", function(err, result){
	console.log("DB switched " + config.database);
	connection.query(sqlcmdtable, function(err, result){
                if(err) throw err;
				console.log("Table users created");
				connection.query(sqlcmdaddsuperadmin, [sqlcmdaddsuperadminvalues], function(err, result) {
					if (err) throw err;
					console.log("User " + config.isSuperAdminUsername + " (" + config.isSuperAdmin + ") has given Admin permissions.");
					console.log("\nCompleted. You can now start the Bot (npm start)");
					process.exit(1);
				});
                });
                connection.release();
	});
});
}
