
import * as util from './util';
import * as OBD from 'obd-parser';
import * as Promise from 'bluebird';
import * as uuid from 'uuid';
import { createGzip, Gzip } from 'zlib';
import { isAbsolute, join, basename } from 'path';
import { InterfaceGlobal, MonitorEntry } from './interface';
import { createWriteStream, WriteStream, readdir } from 'fs';
import { ensureObdIsConnected } from './connection';
import mkdirp = require('mkdirp');
import PQueue = require('p-queue');

// Each trip needs a unique identifier so we can avoid fuzzy matching times
const TRIP_UUID = uuid.v4();

// We want to keep file sizes in check
const MAX_FILE_SIZE: number = (128 * 1024);

// The pollers that are being requested by the monitor
const pollers:OBD.ECUPoller[] = [];

// Stream used to write output data to disk/stdout
let outputStream: NodeJS.WritableStream;

// Zip stream...if we are using one
let zipper: Gzip;

// Used to queue writes of OBD data to output file(s)
const pqueue = new PQueue({
  concurrency: 1
});


/**
 * Collates all PIDs and their desired intervals, then begins the monitor loop
 * @return {void}
 */
export default function (pids:string[]) {
  Promise.map(pids, (pidCodeOrName) => {
    const pid = pidCodeOrName.split(':')[0];
    const interval = parseInt(pidCodeOrName.split(':')[1], 10);

    if (!pid || !interval || isNaN(interval)) {
      console.error(`PID value ${pidCodeOrName} is not valid. Format must be PID:INTERVAL, e.g 0C:500 to get RPM every 500 milliseconds`);
      process.exit(1);
    }

    const monitor: MonitorEntry = {
      pid: util.getPidByCode(pid) || util.getPidByName(pid),
      interval: interval
    };

    return monitor;
  })
    .then((pids) => monitor(pids));
}


/**
 * Creates the absolute path for an output file directory if the output
 * option is passed.
 * @return {String}
 */
function getOutputDirectoryName (): string {
  const outdir = join(
    util.getProgram().outdir,
    new Date().toJSON().split('T')[0],
    TRIP_UUID
  );

  return isAbsolute(outdir) ? outdir : join(process.cwd(), outdir);
}


/**
 * Creates a nested directory for storage of monitor results
 * @return {Promise<any>}
 */
function createOutputDir (p: string): Promise<any> {
  return new Promise<any>(function (resolve, reject) {
    mkdirp(p, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  })
}


/**
 * Function for Array.prototype.sort for monitor files sorting.
 * Essentialy an integer sort.
 * @return {Number}
 */
function fileSorter (a: string, b: string): number {
  return parseInt(a, 10) - parseInt(b, 10);
}


/**
 * Function for Array.prototype.sort for monitor files sorting.
 * Essentialy an integer sort.
 * @return {Number}
 */
function fileFilter (a: string): boolean {
  return !isNaN(parseInt(a, 10))
}


/**
 * Get the extension to use for files created by our monitor
 * @return {String}
 */
function getFileExt () {
  return util.getProgram().zip ? '.json.zip' : '.json';
}


/**
 * Returns the next filename that will be used to store OBD output.
 * These are numeric and ascend from 0..n
 * @return {Promise<string>}
 */
function getNextFilename (p: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    readdir(p, (err, list) => {
      if (err) {
        reject(err);
      } else {
        if (list.length === 0) {
          resolve(`0${getFileExt()}`);
        } else {
          const largestFilename = list.filter(fileFilter).sort(fileSorter).pop();

          const n = parseInt(
            basename(largestFilename || '0', '.json'),
            10
          );

          resolve(`${n+1}${getFileExt()}`);
        }
      }
    });
  });
}


/**
 * Returns the writeable stream that OBD data will be written to. This also
 * handles determining if file should be rotated and if we need to return a
 * zip stream vs. a plain fs stream.
 * @return {Promise<NodeJS.WritableStream>}
 */
function getWriteStream (): Promise<NodeJS.WritableStream> {
  const outdir = util.getProgram().outdir;
  const useZip = util.getProgram().zip;

  // User wants to print to stdout, easy!
  if (!outdir) {
    return Promise.resolve(outputStream = process.stdout);
  }

  // Existing file stream has not exceeded file size so keep writing to it
  if (outputStream && (<WriteStream>outputStream).bytesWritten < MAX_FILE_SIZE) {
    return Promise.resolve(useZip ? zipper : outputStream);
  }

  // Existing stream needs to be finished up if it exists
  if (outputStream) {
    console.log(`out file size exceeded ${MAX_FILE_SIZE / 1024}KB - rotating...`);

    if (useZip) {
      zipper.end();
    } else {
      outputStream.end();
    }
  }

  const curOutDir = getOutputDirectoryName();

  console.log(`creating new output file in ${curOutDir}...`);

  return new Promise<NodeJS.WritableStream>(function (resolve, reject) {
    createOutputDir(curOutDir)
      .then(() => getNextFilename(curOutDir))
      .then((filename) => {
        outputStream = createWriteStream(
          join(curOutDir, filename)
        );

        outputStream.on('open', () => {
          console.log(`created new output file ${filename}...`);
          if (useZip) {
            zipper = createGzip();

            zipper.pipe(outputStream);

            resolve(zipper);
          } else {
            resolve(outputStream);
          }
        });

        outputStream.on('error', (err: Error) => {
          reject(err);
        });
      })
  });
}


/**
 * Handle process SIGINT event to gracefully end the program and ensure
 * remaing data is written out
 * @return {void}
 */
function onSigint () {
  console.log('shutting process down gracefully. please wait');
  pollers.forEach((p) => {
    p.stopPolling();
  });

  pqueue.add(() => {
    return getWriteStream();
  })
    .then((stream: NodeJS.WritableStream) => {

      if (stream === process.stdout) {
        // No need to do any graceful shutdown
        process.exit(0);
      }

      // Wait for the final write(s) to complete after "end" is called
      // and before closing the process completely
      stream.on('close', function () {
        console.log('streams have finished writing. exiting');
        process.exit(0);
      });

      stream.end();
    })
}

function monitor (pids:MonitorEntry[]) {
  return ensureObdIsConnected()
    .then(() => {
      process.on('SIGINT', onSigint);

      return Promise.map(pids, (p) => {
        const poller:OBD.ECUPoller = new OBD.ECUPoller({
          pid: p.pid,
          interval: p.interval
        });

        pollers.push(poller);

        poller.on('data', (output: OBD.OBDOutput) => {
          pqueue.add(() => {
            return getWriteStream();
          })
            .then((stream: NodeJS.WritableStream) => {
              stream.write(`${JSON.stringify(output)}\n`);
            });
        });

        poller.startPolling();
      });
    });
}
