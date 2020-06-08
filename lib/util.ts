
import * as OBD from 'obd-parser';
import * as _ from 'lodash';
import { InterfaceGlobal, InterfaceCLI } from './interface';

/**
 * Returns the commander singleton, but with a custom interface applied
 * @return {InterfaceCLI}
 */
export function getProgram (): InterfaceCLI {
  return (<InterfaceGlobal>(global as unknown)).program;
}

export function getPidInstances (): Array<OBD.PIDS.PID> {
  var ps = _.map(
    _.keys(OBD.PIDS),
    (p:string) => {
      if (p === 'PID') {
        // The base class should not be constructed
        return null;
      }

      return new OBD.PIDS[p]();
    }
  );

  return _.remove(ps, (pid) => {
    return pid !== null;
  });
}

export function getPidByCode (code: string):OBD.PIDS.PID {
  const p = _.find(getPidInstances(), (p:OBD.PIDS.PID) => {
    return p.getPid() === code.toUpperCase();
  });

  if (!p) throw new Error(`failed to find PID with code: ${code}`)

  return p
}

export function getPidByName (name: string):OBD.PIDS.PID {
  const p = _.find(getPidInstances(), (p:OBD.PIDS.PID) => {
    return p.getName().toUpperCase() === name.toUpperCase();
  });

  if (!p) throw new Error(`failed to find PID with name: ${name}`)

  return p
}
