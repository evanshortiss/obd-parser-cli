
import * as OBD from 'obd-parser';

export default function () {
  console.log('\nAvailable PIDs for "poll" commands are:\n');

  const ret:Object[] = [];

  // Loop PID class names and construct them
  Object.keys(OBD.PIDS).forEach((pid) => {
    if (pid !== 'PID') {
      const inst:OBD.PIDS.PID = new OBD.PIDS[pid]();

      console.log(`${inst.getPid()} - ${inst.getName()}`);
    }
  });

  console.log('\nExample command usage: "obd poll 2F"');
  console.log('\nIt\'s also valid to supply the name, e.g "Fuel Level Input"\n');
}
