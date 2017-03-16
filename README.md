# obd-parser-cli

A CLI tool that can interface with On Board Diagnostics (OBD II) of vehicles.

## Compatibility and Testing
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
USB ELM327 cable [like these](https://www.amazon.com/s/?field-keywords=elm327+usb).
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
and available for use by this CLI. You can use it like so:

```
$ obd poll -c serial -b 38400 -i /dev/tty.serialusb "Engine RPM"
```

The `-c serial` tells us that we want to use a serial connection, `-b`
specifies the baudrate (this might vary based on vehicle) ,and `-i` specifies
the interface that the serial connection is running at.

## Usage
Once installed you can run the program from a terminal. Here's how to load
the help menu:

```
$ obd --help

🚔  OBD CLI 🚘

  Usage: index [options] [command]


  Commands:

    list                                      list supported pids that can be passed to "poll" commands
    poll <pid> [pids...]                      poll for an OBD value(s) specified by <pid> or a list of pids
    monitor <pid:interval> [pid:interval...]  similar to poll, but continously checks PID values every n milliseconds,
        e.g 0C:1000 will get RPM every 1000 milliseconds

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -c, --connection <string>  type of connection, valid options are "fake" or "serial"
    -b, --baudrate <number>    control connection baudrate, e.g 38400
    -o, --outdir <string>      loation to create folder containing monitor results
    -i, --interface <name>     the interface to use for connection, e.g /dev/tty.serialusb
```

### Listing PIDs (list)

Use the list command to view PIDs that can be read from vehicles. Currently
only a handful are supported by this module and certain vehicles will not
support all PIDS either.

Here's how you can view them:

```
$ obd list

🚔 OBD CLI 🚘

Available PIDs for "poll" commands are:

2F - Fuel Level Input
0C - Engine RPM
05 - Engine Coolant Temperature
0D - Vehicle Speed
04 - Calculated Engine Load
0A - Fuel Pressure
0B - Intake Manifold Absolute Pressure
0F - Intake Air Temperature
10 - MAF Air Flow Rate
11 - Throttle Position
1C - OBD Standard
03 - Fuel System Status
20 - Supported PIDs

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
a serial conncetion you can try the following (macOS tested) example:

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

### Monitor

The monitor command is similar to poll, but instead it prints lines of JSON
continuously until the process is killed. You can use the `--output` option
to specify a directory to write JSON files to that will contain this data.
This creates a folder in the specified `output` directory with the current
date, and then writes the JSON to folders that represent each trip taken.
Inside each folder a JSON file is created. The name of the file will be
0.json by default. Once this file reaches ~128KB in size a new file, 1.json
will be created, and so on until the process is killed.

Here's a sample command and output data:

```
$ obd monitor 0d:100 0c:1000 05:5000 -c serial -i /dev/tty.usbserial -b 38400

🚔  OBD CLI 🚘

Connecting via "fake" type...
OBD module intialised...

{"ts":"2017-03-15T16:57:18.296Z","bytes":"410D26","value":38,"counter":715,"pretty":"38km/h","name":"Vehicle Speed","pid":"0D"}
{"ts":"2017-03-15T16:57:18.318Z","bytes":"410C16CA","value":1458.5,"counter":716,"pretty":"1458.5rpm","name":"Engine RPM","pid":"0C"}
{"ts":"2017-03-15T16:57:18.946Z","bytes":"410F43","value":27,"counter":717,"pretty":"27°C","name":"Intake Air Temperature","pid":"0F"}
{"ts":"2017-03-15T16:57:19.295Z","bytes":"410D26","value":38,"counter":718,"pretty":"38km/h","name":"Vehicle Speed","pid":"0D"}
{"ts":"2017-03-15T16:57:19.316Z","bytes":"410C1684","value":1441,"counter":719,"pretty":"1441rpm","name":"Engine RPM","pid":"0C"}
{"ts":"2017-03-15T16:57:20.296Z","bytes":"410D22","value":34,"counter":720,"pretty":"34km/h","name":"Vehicle Speed","pid":"0D"}
{"ts":"2017-03-15T16:57:21.235Z","bytes":"410572","value":74,"counter":722,"pretty":"74°C","name":"Engine Coolant Temperature","pid":"05"}
```

If using the `--output` option, then the created folder structure might look
as follows if you had two trips in a given day:

```
| |____
| | |____2017-03-12
| | | |____2ee5ff94-a02d-4791-9cd8-8b0d9770c34f
| | | | |____0.json
| | | |____599d7463-c568-441d-b6f7-86ea92ea3e59
| | | | |____0.json
| | | | |____1.json
| | | | |____2.json
| | | | |____3.json
```