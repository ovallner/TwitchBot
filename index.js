const config = require('./config');
const { port, myNick, password, server, channel, hueHost, hueUser, lastFMKey, lastFMSecret } = config;
const hue = require('node-hue-api'),
      HueApi = hue.HueApi,
      lightState = hue.lightState;
const ircClient = require('node-irc');
const LastfmAPI = require('lastfmapi');
const convert = require('color-convert');
const https = require('https');


/*********** callbacks ************/
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const displayResult = function(result) {
    console.log(JSON.stringify(result, null, 2));
};
const displayError = function(err) {
    console.log(err);
};
async function resetLights() {
    await sleep(7000);
    state = lightState.create().off();
    api.setGroupLightState(7, state)
        .then(displayResult)
        .done();
    state = lightState.create().on();
    api.setGroupLightState(7, state)
        .then(displayResult)
        .done();
}
/*********** callbacks ************/

//const api = new HueApi(hueHost, hueUser);
//api.config().then(displayResult).done();

const lfm = new LastfmAPI({
	'api_key' : lastFMKey,
	'secret' : lastFMSecret
});

function getViewers() {
    https.get('https://tmi.twitch.tv/group/user/maellic/chatters', (resp) => {
        console.log("Attempting to get");
            let data = ''
            resp.on('data', (chunk) => {
                data += chunk;
            });
        resp.on('end', () => {
            //console.log(data)
            //console.log(JSON.parse(data));
            viewers = JSON.parse(data)['chatters']["viewers"];
            console.log(viewers);
        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}



const client = new ircClient(server, port, myNick, myNick, password);
client.verbosity = 3;
client.debug = true;
client.on('ready', () => {
    client.join(channel);
});

client.on('CHANMSG', data => {
    // Checks if the message is a chat command
    if(data.message[0] === "!"){
        let command = data.message.slice(1);

        if(command === "rainbow"){
            state = lightState.create().on().effectColorLoop()
            api.setGroupLightState(7, state)
                .then(displayResult)
                .then(resetLights)
                .done();
        }
        if(command === "random"){
            state = lightState.create().on().hsb(Math.random() * 360, Math.random() * 100, Math.random() * 100);
            api.setGroupLightState(7, state)
                .then(displayResult)
                .then(resetLights)
                .done();
        }
        else if(command === "song"){
            lfm.user.getRecentTracks({
                'limit':1,
                'user': "maellic",
                'api_key': lastFMKey,
                'format':'json'
            }, function (err, result) {
                if (err) { return console.log('We\'re in trouble', err); }
                track = result['track'][0]
                if (result['track'].length == 2) {
                    if (track['@attr']['nowplaying'] === 'true') {
                        client.say(channel, 'Currently playing "' + track['name'] + '" by ' + track['artist']['#text']);
                    }
                }
                else {
                    listen_date = result['track'][0]['date']['uts'];
                    curr_date = Math.round(new Date().getTime() / 1000);
                    delta = curr_date-listen_date;
                    // If less than an hour has passed
                    if (delta < 3600) {
                        client.say(channel, 'Listened to "' + track['name'] + '" by ' + track['artist']['#text'] + ' ' + Math.round(delta/60) + " minutes ago");
                    }
                    // If less than a day has passed
                    else if (delta < 86400) {
                        client.say(channel, 'Listened to "' + track['name'] + '" by ' + track['artist']['#text'] + ' ' + Math.round(delta/3600) + " hour(s) ago");
                    }
                    else {
                        client.say(channel, 'Listened to "' + track['name'] + '" by ' + track['artist']['#text'] + ' ' + Math.round(delta/86400) + " day(s) ago");
                    }
                }

            });
        }
        else {
            try {
                colorHSL = convert.keyword.hsl(command);
                state = lightState.create().on().hsl(colorHSL[0], colorHSL[1], colorHSL[2]);
                api.setGroupLightState(7, state)
                    .then(displayResult)
                    .then(resetLights)
                    .done();
            }
            catch(err) {
                console.log(err.message);
            }
        }
        
        
        
    }
});

client.on('PRIVMSG', function (data) {
    var message = 'Hi, ' + data.sender;
    console.log("Priv msg!");
    if(data.sender !== nick) client.say(data.sender, message);
  });

client.on('JOIN', function (data) {
    console.log("SOMEONE HAS JOINED!");
    console.log(data);
    
    //client.say()
});

client.connect();

getViewers();