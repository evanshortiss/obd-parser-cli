#!/usr/bin/env node

import program = require('commander');
import { InterfaceGlobal, InterfaceCLI } from '../lib/interface';

// Extend global with our program opts
let g = <InterfaceGlobal>global;
g.program = program;

import poll from '../lib/command-poll';
import list from '../lib/command-list';

console.log('\n🚔  OBD CLI 🚘');

program
  .version(require('../package.json').version)
  .option('-c, --connection <string>', 'type of connection, valid options are "fake" or "serial"')
  .option('-b, --baudrate <number>', 'control connection baudrate, e.g 38400')
  .option(
    '-i, --interface <name>',
    'the interface to use for connection, e.g /dev/tty.serialusb'
  );

program
  .command('list')
  .description('list supported pids that can be passed to "poll" commands')
  .action(list);

program
  .command('poll <pid> [pids...]')
  .description('poll for an OBD value(s) specified by <pid> or a list of pids')
  .action(function (pid:string, extraPids:string[]) {
    if (!pid) {
      console.log('please specify at least 1 pid, e.g "obd poll -c fake 2F')
      process.exit(1);
    }

    poll([pid].concat(extraPids || []));
  });

program
  .on('*', function() {
    console.log('argv', process.argv);
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
} else {
  program.parse(process.argv);
}
