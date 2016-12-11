
import program = require('commander');

export interface InterfaceCLI extends program.ICommand {
  baudrate?: string
  interface?: string
  connection?: string
}

export interface InterfaceGlobal extends NodeJS.Global {
  program: InterfaceCLI
}
