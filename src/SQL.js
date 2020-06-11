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
			connection.query('SELECT * FROM users;', function(err, rows, fields) {
				connection.release();
				console.log(rows, err);
				if(Object.entries(rows).length === 0){
					resolve("0");
				}else{
					resolve(rows);
				}
			});
		});
	});
}

let updateUser = function(para) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			let sqlquery = "UPDATE `users` SET `" + para.collum + "` = '" + para.valuenew + "' WHERE (`userhash` = '" + hash(para.id) + "') and (`" + para.collum + "` = '" + para.valueold + "')"; //Modify User Parameter
			connection.query(sqlquery, function(err, rows, fields) {
				if (err) { throw err; }
				connection.release();
				//console.log(rows);
				if(rows.changedRows >= 1){
					console.log("UpdateUser: Done " + para.id + " Collum: " + para.collum + " New: " + para.valuenew + " Old: " + para.valueold)
					resolve("done");
				}else{
					console.log("UpdateUser: Fail " + para.id + " Collum: " + para.collum + " New: " + para.valuenew + " Old: " + para.valueold)
					reject("fail")
				}
			});
		});
	});
}

module.exports = {
	requestData,
	listall,
	updateUser
};