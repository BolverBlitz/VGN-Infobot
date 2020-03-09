# VGN Infobot

### Setup

`npm install`

Enter Telegram Bottoken and MySQL Passwort, if you want to use Twitter you need to insert your keys and secrets in secret.json and enable twitter in config.json
```json
{
    "dbreaduserpwd":"MySQL Passwort",
    "bottoken":"Telegram Bot Token",
    "twitter": [
        {
            "consumer_key": "Get from Twitter"
        },
        {
            "consumer_secret": "Get from Twitter"
        },
        {
            "access_token_key": "Get from Twitter needs read/write permissions"
        },
        {
            "access_token_secret": "Get from Twitter needs read/write permissions"
        }
    ]
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


### Add language
To add a language please send me the language.json file via Telegram or do a pull request.
If you do a pull request, don´t forget to add your language in the import of i18n. 
Please name the .json the same as you write into the line below.
```js
const i18n = newI18n(__dirname + "/languages", ["en", "de", "Your language"]);
```
The bot will automatically circle through all languages in the usersettings after restart.

### VAG API for nodeJS
If you just want to use the API for your own project go into src/VAGAPIPromise.js
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

Error handling:

If the API is to slow or not reachable the awnser of the promise will be `ENOTFOUND`, `ECONNREFUSED`, `ETIMEDOUT`, `ECONNRESET`.

```js
vag.OnLocation(Data).then(function(Haltestellen) {
	if(Haltestellen != 'ENOTFOUND' && Haltestellen != 'ECONNREFUSED' && Haltestellen != 'ETIMEDOUT' && Haltestellen != 'ECONNRESET') {
		if no error
	}else{
		if error
	}
});
```

