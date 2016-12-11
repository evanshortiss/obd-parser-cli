
import * as util from './util';
import * as OBD from 'obd-parser';
import * as Promise from 'bluebird';
import * as table from 'table';
import { ensureObdIsConnected } from './connection';

export default function (pids:string[]) {
  Promise.map(pids, (pidCodeOrName) => {
    return util.getPidByCode(pidCodeOrName) || util.getPidByName(pidCodeOrName);
  })
    .then((pids) => poll(pids));
}

function poll (pids:OBD.PIDS.PID[]) {
  return ensureObdIsConnected()
    .then(() => {
      return Promise.map(pids, (p) => {
        const poller:OBD.ECUPoller = new OBD.ECUPoller({
          pid: p,
          interval: null
        });

        let pd = poller.poll();

        return pd;
      });
    })
    .then((pollReults) => {
      console.log('\nResults:\n');

      var data:Array<[string,string]> = [];

      pollReults.forEach((p) => {
        // This will always be a string for us so we can cast it
        data.push([<string>p.name, p.value.toFixed(2)]);
      });

      console.log(table.table(data, {
        border: table.getBorderCharacters('norc')
      }));
    });
}
