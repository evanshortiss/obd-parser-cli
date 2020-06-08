
import * as OBD from 'obd-parser';
import { EventEmitter } from 'events';
import { InterfaceGlobal, InterfaceCLI } from './interface';

const g = <InterfaceGlobal>(global as unknown);
const program = <InterfaceCLI>g.program;

let connection:Connection;

class Connection extends EventEmitter {
  private connected:boolean = false;

  constructor () {
    super()
  }

  isConnected () {
    return this.connected;
  }

  connect (connector:Function) : void {
    const self = this;

    if (this.connected) {
      self.emit('connected');
    } else {
      console.log(`\nConnecting via "${program.connection}" type...`);
      // Need to initialise the OBD module with a "connector" before starting
      OBD.init(connector)
        .then(function () {
          console.log('OBD module intialised...');
          self.connected = true;
          self.emit('connected');
        })
        .catch((e) => {
          console.log('failed to connect to obd', e.stack);
          process.exit(1);
        });
    }
  }
}

function getConnector (): Function {
  if (program.connection === 'fake') {
    return require('obd-parser-development-connection')();
  } else if (program.connection === 'serial') {
    return require('obd-parser-serial-connection')({
      serialPath: program.interface,
      serialOpts: {
        baudrate: program.baudrate ? parseInt(program.baudrate) : 38400
      }
    });
  } else {
    throw new Error(`please specify a valid connection type using option -c`);
  }
}

export function ensureObdIsConnected (): Promise<any> {
  // Use a serial connection to connect
  let connector = getConnector()

  if (connection && connection.isConnected()) {
    return Promise.resolve();
  } else {

    if (!connection) {
      // Connection needs to be initialised if this is the first call
      connection = new Connection();
      connection.connect(connector);
    }

    return new Promise(function (resolve, reject) {
      connection.once('connected', resolve);
      connection.once('error', reject);
    });
  }
}
