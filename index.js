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

/**
 * Callback for run
 * 
 * @callback runCallback
 * @param {Int} code - Exit code
 */

/**
 * Run a command and callback with it's exit code
 * 
 * @param {String} command - A command to execute
 * @param {Array} args - A list of arguments
 * @param {runCallback} callback - Callback for exit code
 */
function run(command, args, callback){
    // Spawn a child process
    const ls = Spawn(command, args);

    // Log stdout
    ls.stdout.on('data', (data) => {
        console.log(`${data}`);
    });
    
    // Log stderr
    ls.stderr.on('data', (data) => {
        console.log(`${data}`);
    });

    // Callback on close
    ls.on('close', (code) => {
        callback(code);
    });
}

/**
 * Sends an SMS meesage to a list of phone numbers
 * 
 * @param {String} message - A message to sent
 * @param {Array} phones - A list of phone numbers
 */
function send(message, phones){
    // Loop through phones
    phones.forEach((phone) => {
        // Send SMS with Twilio
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


/**
 * Initiates a new config file
 */
function init(){
    
    // Use readline to parse stdin
    var rl = Readline.createInterface({
        input: process.stdin
    });
    // Empty object for new config
    var data = {};
    // List of steps
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
    // Last step
    var step;

    // Listen for a line input ot stdin
    rl.on('line', (input) => {
        // Remove possible whitespace
        input = input.trim();
        // Transform input
        if(step.transform) input = step.transform(input);
        // Set field to input value
        data[step.name] = input;
        // Next field
        next(steps);
    });
    
    // Start prompting
    next(steps);

    // Run next prompt
    function next(steps){
        // When we're out of steps
        if(!steps.length){
            // Save config file
            FS.writeFileSync(CONFIG_FILE, `${JSON.stringify(data, null, 4)}\n`);
            console.log(`Config file saved to ${CONFIG_FILE}`);
            // Exit so the user doesn't have to
            process.exit();
            return;
        }
        // Save next step and remove it from the list
        step = steps.shift();
        // Ask the current question
        console.log(step.question);
    }
}


/**
 * Splits a string on commas and returns the resulting array
 * 
 * @param {String} val - A value to split
 * @returns {Array}
 */
function list(val){
    return val.split(',');
}