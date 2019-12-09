var VAG = require('./src/VAGAPIPromise')
var Name = 'Opern';

 
 VAG.Haltestellen(Name).then(
    function(message) {
     console.log(message);
    });

    /*var Data = {
        lat: '49.45015694',
        lon: '11.083455',
        distance: 250, //Get From DB for User
        sort: 'Distance', //or Alphabetically
        mode: 'count', //Static
        para: 3, //Get From DB for USER
        };

 VAG.OnLocation(Data)
	.then(
    function(message) {
     console.log(message);
    })
	.catch(
	function(message) {
     console.log("Error" + message);
    });*/