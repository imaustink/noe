# Notify on Exit (NOE)
Have you ever wanted an SMS notification when a particular command exits? Notify on Exit can help!

Example:
```
$ noe -r 'node import.js'
```
In this example ```noe``` will run ```node import.js``` and notify the configured recipient of the exit code.
###### Note: if you are running a command with 1 or more arguments it must be wrapped in quotes.

# Installation

## Prerequisites

* Twilio account
* Twilio phone number
* Node.js
* NPM

## Install

* ```$ sudo npm install noe -g```
* ```$ noe```

The first time you run ```noe``` it will ask you to enter your Twilio SID, Twilio auth token, Twilio phone number and recipient phone number(s), which will be saved into .noe-config.json of your home directory.

It is recommended to test your config file before using ```noe```, simply run ```noe --test```.

You may edit the config file directly or run ```noe --init``` to initialize a new config file.

# Options
| Option              | Description                                 |
|---------------------|---------------------------------------------|
| ```-h, --help```    | output usage information                    |
| ```-V, --version``` | output the version number                   |
| ```--init```        | Initiate new config file                    |
| ```-t, --test```    | Send test message                           |
| ```-r, --run```     | Command to exacute and watch                |
| ```-p, --phones```  | Phone number(s) to notify (comma separated) |
| ```-l, --label```   | Custom label for task                       |
