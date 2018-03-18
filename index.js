const irc = require('node-irc')
const ircClient = require('node-irc');
const config = require('./config');
console.dir(config);

const { port, myNick, password, server, channel } = config;

const client = new ircClient(server, port, myNick, myNick, password);
client.verbosity = 3;
client.debug = true;

client.on('ready', () => {
    console.log('ayy we ready');
    client.join(channel);
});

client.on('CHANMSG', data => {
    console.log('people are talking to me!');
    console.dir(data);
});

client.connect();

