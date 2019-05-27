var fs=require('fs');
var textLines = fs.readFileSync('sensor.txt').toString().split("\n");
var lineIndex=0;
const Mam = require('./lib/mam.client.js');
const IOTA = require('iota.lib.js');
const moment = require('moment');
const iota = new IOTA({ provider: 'https://didiota.ddjros.net:14267'});

const MODE = 'restricted'; // public, private or restricted
const SIDEKEY = 'mysecret'; // Enter only ASCII characters. Used only in restricted mode
const SECURITYLEVEL = 3; // 1, 2 or 3
const TIMEINTERVAL  = 15; // seconds

// Initialise MAM State
let mamState = Mam.init(iota, undefined, SECURITYLEVEL);

// Set channel mode
if (MODE == 'restricted') {
    const key = iota.utils.toTrytes(SIDEKEY);
    mamState = Mam.changeMode(mamState, MODE, key);
} else {
    mamState = Mam.changeMode(mamState, MODE);
}

// Publish data to the tangle
const publish = async function(packet) {
    // Create MAM Payload
    const trytes = iota.utils.toTrytes(JSON.stringify(packet));
    const message = Mam.create(mamState, trytes);

    // Save new mamState
    mamState = message.state;
    console.log('Root: ', message.root);
    console.log('Address: ', message.address);
	
    // Attach the payload.
    await Mam.attach(message.payload, message.address);

    return message.root;
}

const generateJSON = function() {
    const dateTime = moment().utc().format('DD/MM/YYYY hh:mm:ss');
    const json = {"data":textLines[lineIndex++], "dateTime": dateTime};
    return json;
}

const executeDataPublishing = async function() {
    const json = generateJSON();
    console.log("json=",json);
	
    const root = await publish(json);
    const dataTime = moment().utc().format('DD/MM/YYYY hh:mm:ss');
    console.log(`dateTimeCreated: ${json.dateTime}, data: ${json.data}, root: ${root},dateTimeAttached:${dataTime}`);
}

// Start it immediately
executeDataPublishing();

setInterval(executeDataPublishing, TIMEINTERVAL*1000);

