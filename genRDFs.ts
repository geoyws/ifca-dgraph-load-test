import "dotenv";
import { WriteStream, createWriteStream } from "fs";

import { finished } from "stream";
import { once } from "events";
import { promisify } from "util";

const pFinished = promisify(finished);

const randomNumber = (min: number, max: number): number => {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const randomAmountString = () => `"${randomNumber(100, 10000)}"`;

const randomDate = (start: Date, end: Date) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  ).toISOString();
};

const randomRelevantDateString = () =>
  `"${randomDate(new Date("1995-01-01T08:00:00+08:00"), new Date())}"`;

enum SubjectType {
  Hotel = "Hotel",
  Room = "Room",
  Ledger = "Ledger",
}
const UID = (type: string, i: number) => "_:" + type + i;

const NameString = (type: string, i: number) => `"${type}${i}"`;

// const PredicateString = (predicate: string) => '<' + predicate + '>'

// 200 Hotels altogether
const Hotel = (i: number) => {
  const subjectType = SubjectType.Hotel;
  const uid = UID(subjectType, i);
  return `
${uid} <dgraph.type> ${subjectType} .
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
  const uid = UID(subjectType, i);
  return `
${uid} <dgraph.type> ${subjectType} .
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
  const uid = UID(subjectType, i);
  return `
${uid} <dgraph.type> ${subjectType} .
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

// '/root/work/data/dgraph/scripts/load-test/rdf/'
const PATH = "dist/";
// to save us from typos
const _200M = 200000000;
// const _1M = 1000000

const TARGET_HOTELS = process.env?.TARGET_HOTELS
  ? +process.env.TARGET_HOTELS
  : 200;

const TARGET_ROOMS_PER_HOTEL = process.env?.TARGET_ROOMS_PER_HOTEL
  ? +process.env.TARGET_ROOMS_PER_HOTEL
  : 100;
const TARGET_ROOMS = TARGET_HOTELS * TARGET_ROOMS_PER_HOTEL; // 20K

const TARGET_LEDGERS = process.env?.TARGET_LEDGERS
  ? +process.env.TARGET_LEDGERS
  : _200M;
const TARGET_LEDGERS_PER_ROOM = TARGET_LEDGERS / TARGET_ROOMS; // 10K, you can lower this for testing

//const MAX_ENTRIES_PER_RDF_FILE = _1M // basically 1 RDF file per Hotel

// https://2ality.com/2019/11/nodejs-streams-async-iteration.html#writing-to-writable-streams

const writeStreamReg: Record<string, Writeable> = {};

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
  let iHotel = 1;
  while (iHotel <= TARGET_HOTELS) {
    // 1 RDF file per Hotel, so just one writeStream
    // streams are important when writing to large files
    const writeable = new Writeable(
      createWriteStream(PATH + NameString(SubjectType.Hotel, iHotel) + ".rdf", {
        encoding: "utf8",
        flags: "a",
      })
    );
    await writeable.write("{ set {");
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
    await writeable.write("} }");
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
