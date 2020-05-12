import { Command  } from 'commander'
import { WriteStream, createWriteStream } from "fs";

import { finished } from "stream";
import { once } from "events";
import { promisify } from "util";

const program = new Command()
program
  .version('2020.05')
  .option('-i, --index', 'Starting index for Hotels. E.g. `-i 40` generation would start from Hotel40.')
  .option('-h, --hotels', 'Number of Hotels to generate. E.g. `-h 20` would generate 20 Hotels.')
  .option('-r, --rooms', 'Number of Rooms per Hotel to generate. E.g. `-r 1000` would generate 1K Rooms per Hotel.') 
  .option('-l, --ledgers', 'Number of Ledgers per Room to generate. E.g. `-l 2000` would generate 2K Ledgers per Room.') 

/**
 * Helpers
 */
const pFinished = promisify(finished);

const quote = (str: string) => `"${str}"`;

const randomNumber = (min: number, max: number): number => {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const randomAmountString = () => quote(randomNumber(100, 10000).toString());

const randomDate = (start: Date, end: Date) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

const randomRelevantDateString = () =>
  quote(
    randomDate(new Date("1995-01-01T08:00:00+08:00"), new Date()).toISOString()
  );

enum SubjectType {
  Hotel = "Hotel",
  Room = "Room",
  Ledger = "Ledger",
}
const UID = (type: string, i: number) => "_:" + type + i;

const NameString = (type: string, i: number) => `"${type}${i}"`;

// const PredicateString = (predicate: string) => '<' + predicate + '>'

/**
 * End of Helpers
 */

// 200 Hotels altogether
const Hotel = (i: number) => {
  const subjectType = SubjectType.Hotel;
  const uid = UID(subjectType, i);
  return `
${uid} <dgraph.type> ${quote(subjectType)} .
${uid} <name> ${NameString(subjectType, i)} .
`;
};

// ({
// 	uid: UIDString(SubjectType.Hotel, i),
// 	name: NameString(SubjectType.Hotel, i),
// })

// 200 * 100 = 20,000 Rooms altogether
// 100 Rooms per Hotel
const Room = (i: number, iHotel: number) => {
  const subjectType = SubjectType.Room;
  const uid = UID(subjectType, i) + UID(SubjectType.Hotel, iHotel);
  return `
${uid} <dgraph.type> ${quote(subjectType)} .
${uid} <hotel> ${UID(SubjectType.Hotel, iHotel)} .
${uid} <name> ${NameString(subjectType, i)} .
`;
};
// ({
// 	uid: UIDString(SubjectType.Room, i),
// 	hotel: UIDString(SubjectType.Hotel, iHotel),
// 	name: NameString(SubjectType.Room, i),
// })

// 200M Ledgers altogether
// 200M / 200 = 1M Ledgers per Hotel
// 200M / (200 * 100) = 10K Ledgers per Room
const Ledger = (i: number, iHotel: number, iRoom: number) => {
  const subjectType = SubjectType.Ledger;
  const uid = UID(subjectType, i) + UID(SubjectType.Room, iRoom) + UID(SubjectType.Hotel, iHotel);
  return `
${uid} <dgraph.type> ${quote(subjectType)} .
${uid} <hotel> ${UID(SubjectType.Hotel, iHotel)} .
${uid} <room> ${UID(SubjectType.Room, iRoom)} .
${uid} <createdTs> ${randomRelevantDateString()} .
${uid} <amount> ${randomAmountString()} .
`;
};
// ({
// 	uid: UIDString(SubjectType.Ledger, i),
// 	hotel: UIDString(SubjectType.Hotel, iHotel),
// 	room: UIDString(SubjectType.Room, iRoom),
// 	createdTs: randomRelevantDate(),
// 	amount: randomAmount(),
// })

// https://2ality.com/2019/11/nodejs-streams-async-iteration.html#writing-to-writable-streams

const writeStreamReg: Record<string, Writeable> = {}; // regi

class Writeable {
  symbol: symbol = Symbol();

  constructor(public writeStream: WriteStream) {
    this.writeStream.on("error", (err) => console.log(err));
    writeStreamReg[(this.symbol as unknown) as string] = this;
  }

  async write(chunk: string) {
    if (!this.writeStream.write(chunk)) {
      await once(this.writeStream, "drain");
    }
  }

  async finish() {
    delete writeStreamReg[(this.symbol as unknown) as string];
    this.writeStream.end();
    await pFinished(this.writeStream);
  }
}

const main = async () => {
  const TARGET_HOTELS = process.argv[2]

  let iHotel = 1;
  while (iHotel <= TARGET_HOTELS) {
    // 1 RDF file per Hotel, so just one writeStream
    // streams are important when writing to large files
    const writeable = new Writeable(
      createWriteStream(PATH + SubjectType.Hotel + iHotel + ".rdf", {
        encoding: "utf8",
        flags: "a",
      })
    );
    await writeable.write(Hotel(iHotel));

    let iRoom = 1;
    while (iRoom <= TARGET_ROOMS_PER_HOTEL) {
      await writeable.write(Room(iRoom, iHotel));
      let iLedger = 1;
      while (iLedger <= TARGET_LEDGERS_PER_ROOM) {
        await writeable.write(Ledger(iLedger, iHotel, iRoom));
        //console.log('iLedger:', iLedger)
        iLedger++;
      }
      console.log("iRoom:", iRoom);
      iRoom++;
    }
    await writeable.finish();

    console.log("iHotel:", iHotel);
    iHotel++;
  }

  process.exit();
};

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options: any, exitCode: any) {
  Object.values(writeStreamReg).map((v) => v.finish());
  if (options.cleanup) console.log("clean");
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

main();
