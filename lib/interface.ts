
import program = require('commander');
import * as OBD from 'obd-parser';

export interface InterfaceCLI extends program.ICommand {
  baudrate?: string
  interface?: string
  connection?: string
  outdir?: string
  zip?: boolean
}

export interface InterfaceGlobal extends NodeJS.Global {
  program: InterfaceCLI
}

export interface MonitorEntry {
  pid: OBD.PIDS.PID
  interval: number
}
