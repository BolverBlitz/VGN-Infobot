# VGN Infobot

### Setup

`npm install`

Enter Telegram Bottoken and MySQL Passwort in secret.json
```json
{
    "dbreaduserpwd":"MySQL Passwort",
    "bottoken":"Telegram Bottoken"
}
```

`dbreaduserhost` is the IP of the MySQLServer, you can use localhost if it runs localy.
`dbreaduser` enter MySQL User that has accses to create and modyfiy a DB.
`database` enter Database Name.
```json
{
	"botname":"VGN_Infobot",
	"DefaultLanguage":"DE",
	"DefaultDistance":"500",
	"DefaultSort":"Distance",
	"botversion":"0.1",
	"LogChat":"-1001211106939",
	"isSuperAdmin":"206921999",
	"isSuperAdminUsername":"BolverBlitz",
	"dbreaduserhost":"localhost",
	"dbreaduser":"root",
	"database":"VAGInfo",
	"WTdelmsgshort":"5400",
	"WTdelmsglong":"15400"
}
```

`npm setup`

Wait for `Completed. You can now start the Bot (npm start)`

`npm start`
Console should log "Pushed bot start to the admin", you should see a message from the bot in the chat LogChat.

### VAG API for nodeJS
If you just want to use the API for your own project go into scr/VAGAPIPromise.js
> A working example is [Test.js](https://github.com/BolverBlitz/VGN-Infobot/blob/master/Test.js)

Usage:
`
var VAG = require('./VAGAPIPromise')
`

Haltestellen:
You give it a `string` with the name it should look for.
```js
var Name = 'Opern';
VAG.Haltestellen(Name).then(
    function(message) {
     console.log(message);
    });
```

Returns a Promise Object containing
```js
{   Haltestellenname: 'Opernhaus ',
    VAGKennung: 'OP,OPERNH',
    VGNKennung: 505,
    Longitude: 11.0756094680969,
    Latitude: 49.4468713886159,
    Produkte: 'Bus, U-Bahn',
    Ort: 'NÃ¼rnberg' }
```
Onlocation:
You give this promise a `Object` containing
```js
var Data = {
        lat: '49.45015694', //GPS Location
        lon: '11.083455', //GPS Location
        distance: 250, //Radius in m from the given GPS location
        sort: 'Distance' //or Alphabetically
        };
```
		
This will also give you the same Object like the promise Haltestellen, but with a additional parameter `distance`.

```js
[ { Haltestellenname: 'Marientor ',
    VAGKennung: 'MAR',
    VGNKennung: 430,
    Longitude: 11.0834238945706,
    Latitude: 49.4500896153425,
    Produkte: 'Bus, Tram',
    Distance: 8,
    Ort: 'Nürnberg' },
  { Haltestellenname: 'Gleißbühlstr. ',
    VAGKennung: 'GLEISB',
    VGNKennung: 515,
    Longitude: 11.0854366542474,
    Latitude: 49.4501325247482,
    Produkte: 'Bus',
    Distance: 143,
    Ort: 'Nürnberg' },
  { Haltestellenname: 'Rosa-Luxemburg-Pl. ',
    VAGKennung: 'RO-LUX',
    VGNKennung: 425,
    Longitude: 11.0851455405026,
    Latitude: 49.4516947478956,
    Produkte: 'Bus',
    Distance: 210,
    Ort: 'Nürnberg' } ]
```

