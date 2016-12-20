
import * as OBD from 'obd-parser';
import * as _ from 'lodash';

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
  return _.find(getPidInstances(), (p:OBD.PIDS.PID) => {
    return p.getPid() === code.toUpperCase();
  });
}

export function getPidByName (name: string):OBD.PIDS.PID {
  return _.find(getPidInstances(), (p:OBD.PIDS.PID) => {
    return p.getName().toUpperCase() === name.toUpperCase();
  });
}
