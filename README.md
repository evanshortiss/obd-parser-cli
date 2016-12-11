# obd-parser-cli

A CLI tool that can interface with On Board Diagnostics (OBD) of vehicles.

## Testing
This software has only been tested with a Volkswagen MK6 GTI. Your success in
using this software with your vehicle might vary.

Using this software and related libraries is done so at your own risk.

## Install
```
npm install obd-parser-cli -g
```

NOTE: This module has a native dependency (serialport) that must be compiled
during install. Please ensure you have the relevant tools for compiling C/C++
installed on your machine - typically this is Python v2.7 and developer
tools such as GCC, Visual Studio, or XCode. More details can be found
[here](https://github.com/nodejs/node-gyp#installation)


## Connecting to OBD via USB
Connecting to your vehicle's OBD system is relatively simple, you just need a
USB ELM327 cable (like these)[https://www.amazon.com/s/?field-keywords=elm327+usb].
You might need to install drivers to get the cable working with your laptop, 
such as the macOS drivers at [this link](http://www.totalcardiagnostics.com/support/Knowledgebase/Article/View/19/0/how-to-install-elm327-usbbluetooth-on-mac-and-obd-software). 

After purchasing a cable and installing any required drivers you can connect
your ELM327 cable to your laptop via USB and plug the other end into the cars
OBD port. The OBD port is usually above your gas/break pedal area.

Once you've plugged in your cable to both the laptop and vehicle you can run the
command `ls /dev/tty.*` to verify the connection is detected. On macOS this will
print something like the following:

```
$ ls /dev/tty.*
/dev/tty.Bluetooth-Incoming-Port /dev/tty.usbserial
```

The existence of `/dev/tty.usbserial` tells us that the connection is detected
and available for use by this CLI.


## Usage
Once installed you can run the program from a terminal. Here's how to load
the help menu:

```
$ obd --help

🚔 OBD CLI 🚘

  Usage: index [options] [command]


  Commands:

    list                  list supported pids that can be passed to "poll" commands
    poll <pid> [pids...]  poll for an OBD value(s) specified by <pid> or a list of pids

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -c, --connection <string>  type of connection, valid options are "fake" or "serial"
    -b, --baudrate <number>    control connection baudrate, e.g 38400
    -i, --interface <name>     the interface to use for connection, e.g /dev/tty.serialusb
```

### Listing PIDs

Use the list command to view PIDs that can be read from vehicles. Currently only
a handful are supported. Here's how you can view them:

```
$ obd list

🚔 OBD CLI 🚘

Available PIDs for "poll" commands are:

2F - Fuel Level Input
0C - Engine RPM
05 - Engine Coolant Temperature
0D - Vehicle Speed

Example command usage: "obd poll 2F"

It's also valid to supply the name, e.g "Fuel Level Input"
``` 


### Polling (poll)

Use the poll command to read (poll) values from a vehicle. You must pass the
connection option using "-c" or "--connection". Here we use the "fake"
connection type since we are just testing, but you can also pass "serial" as
explained in the help output.

Once you've entered connection options you can then list the PIDs by name, or
code that you need to read like so:

```
$ obd poll -c fake "Engine RPM" 2f

🚔  OBD CLI 🚘

Connecting via "fake" type...
OBD module intialised...

Results:

┌──────────────────┬─────────┐
│ Engine RPM       │ 4989.00 │
├──────────────────┼─────────┤
│ Fuel Level Input │ 37.65   │
└──────────────────┴─────────┘
```

The above example uses the "fake" connection type and therefore returns
randomised values for the PIDs you requested. If you'd like to connect via
a serial conncetion you can try the following (macOS) example:

```
$ obd poll -c serial -b 38400 -i /dev/tty.serialusb "Engine RPM"

🚔  OBD CLI 🚘

Connecting via "serial" type...
OBD module intialised...

Results:

┌────────────┬────────┐
│ Engine RPM │ 835.50 │
└────────────┴────────┘
```