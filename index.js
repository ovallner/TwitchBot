const config = require('./config');
const { port, myNick, password, server, channel, hueHost, hueUser, lastFMKey, lastFMSecret } = config;
const hue = require('node-hue-api'),
      HueApi = hue.HueApi,
      lightState = hue.lightState;
const ircClient = require('node-irc');
const LastfmAPI = require('lastfmapi');
const colors = {
    "red": 0,
    "green": 120,
    "blue": 240,
    "purple": 300,
    "yellow": 60,
    "orange": 30,
    "cyan": 180
};

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

const api = new HueApi(hueHost, hueUser);
api.config().then(displayResult).done();

const lfm = new LastfmAPI({
	'api_key' : lastFMKey,
	'secret' : lastFMSecret
});


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

        // Checks if the command is to change a color
        if(command in colors) {
            state = lightState.create().on().hsb(colors[command], 100, 100);
            api.setGroupLightState(7, state)
                .then(displayResult)
                .done();
        }
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
        /*
        if(command === "music"){
            lfm.user.getRecentTracks(
                limit=1,
                user= "maellic",
                api_key= lastFMKey
            ).then(displayResult)
            .done();
            //console.log(tracks);
            console.log("music!");
        }
        */
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
    state = lightState.create().on().shortAlert()
    api.setGroupLightState(7, state)
        .then(displayResult)
        .then(resetLights)
        .done();
});

client.connect();

