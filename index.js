#!/usr/bin/env node

// Save config file path
const CONFIG_FILE = `${process.env.HOME || process.env.USERPROFILE}/.noe-config.json`;
const Readline = require('readline');
const FS = require('fs');
var Config;
try{
    // Try to load config
    Config = require(CONFIG_FILE);
}catch(e){
    console.error('No config found!');
    // Init new config file
    return init();
}
const Commander = require('commander');
const Spawn = require('child_process').spawn;
const package = require('./package.json');
const Twilio = require('twilio')(Config.twilio_sid, Config.twilio_token);

Commander
    .version(package.version)
    .option('--init', 'Initiate new config file')
    .option('-t, --test', 'Send test message')
    .option('-r, --run <command>', 'Command to exacute and watch')
    .option('-p, --phones <phones>', 'Phone number(s) to notify (comma separated)', list)
    .option('-l, --label [label]', 'Custom label for task')
    .parse(process.argv);

// Default to notify_numbers if no option is passed
var phones = Commander.phones || Config.notify_numbers;

if(Commander.init) return init();
if(Commander.test) return send(`This is a test message from NOE!`, phones);
if(Commander.run){
    // Parse command and args
    var command = Commander.run.split(/\s+/g);
    var args = command.splice(1, command.length - 1);
    // Default to command if no option is passed
    var name = Commander.label || command;
    // Run command with args
    run(command[0], args, (code) => {
        // Notify numbers of exit
        send(`${name} exited with code ${code}`, phones);
    });
    return;
}

function run(command, args, callback){
    const ls = Spawn(command, args);

    ls.stdout.on('data', (data) => {
        console.log(`${data}`);
    });

    ls.stderr.on('data', (data) => {
        console.log(`${data}`);
    });

    ls.on('close', (code) => {
        callback(code);
    });
}

function send(message, phones){
    phones.forEach((phone) => {
        Twilio.sendSms({
            to: phone,
            from: Config.twilio_number,
            body: message
        }, (err, result) => {
            if(err) console.error(`Failed to notify ${phone}`, err);
            else console.log(`Notified ${phone}`);
        });
    });
}

function init(){

    var rl = Readline.createInterface({
        input: process.stdin
    });
    var data = {};
    var steps = [
        {
            question: 'What is your Twilio account SID?',
            name: 'twilio_sid'
        },
        {
            question: 'What is your Twilio account auth token?',
            name: 'twilio_token'
        },
        {
            question: 'What Twilio phone number would you like to use?',
            name: 'twilio_number'
        },
        {
            question: 'What number(s) would you like to notify? Separate numbers with commas.',
            name: 'notify_numbers',
            transform: list
        }
    ];
    var step;

    rl.on('line', (input) => {
        input = input.trim();
        if(step.transform) input = step.transform(input);
        data[step.name] = input;
        next(steps);
    });

    next(steps);

    function next(steps){
        if(!steps.length){
            FS.writeFileSync(CONFIG_FILE, `${JSON.stringify(data, null, 4)}\n`);
            process.exit();
            return;
        }
        step = steps.shift();
        console.log(step.question);
    }

}

function list(val){
    return val.split(',');
}