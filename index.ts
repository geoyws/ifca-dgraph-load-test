import { WriteStream, createWriteStream } from 'fs'

import { finished } from 'stream'
import { once } from 'events'
import { promisify } from 'util'

const pFinished = promisify(finished)

const randomNumber = (min: number, max: number): number => {
	// min and max included
	return Math.floor(Math.random() * (max - min + 1) + min)
}

const randomAmount = () => randomNumber(100, 10000)

const randomDate = (start: Date, end: Date) => {
	return new Date(
		start.getTime() + Math.random() * (end.getTime() - start.getTime())
	)
}

const randomRelevantDate = () =>
	randomDate(new Date('1995-01-01T08:00:00+08:00'), new Date())

enum SubjectType {
	Hotel = 'Hotel',
	Room = 'Room',
	Ledger = 'Ledger',
}
const UIDString = (type: string, i: number) => '_:' + type + i

const UIDObj = (type: string, i: number) => ({
	uid: UIDString(type, i),
})

const NameString = (type: string, i: number) => type + i

// 200 Hotels altogether
const Hotel = (i: number) => ({
	uid: UIDString(SubjectType.Hotel, i),
	name: NameString(SubjectType.Hotel, i),
})

// 200 * 100 = 20,000 Rooms altogether
// 100 Rooms per Hotel
const Room = (i: number, iHotel: number) => ({
	uid: UIDString(SubjectType.Room, i),
	hotel: UIDObj(SubjectType.Hotel, iHotel),
	name: NameString(SubjectType.Room, i),
})

// 200M Ledgers altogether
// 200M / 200 = 1M Ledgers per Hotel
// 200M / (200 * 100) = 10K Ledgers per Room
const Ledger = (i: number, iHotel: number, iRoom: number) => ({
	uid: UIDString(SubjectType.Ledger, i),
	hotel: UIDObj(SubjectType.Hotel, iHotel),
	room: UIDObj(SubjectType.Room, iRoom),
	createdTs: randomRelevantDate(),
	amount: randomAmount(),
})

// to save us from typos
const _200M = 200000000
const _1M = 1000000

const TARGET_HOTELS = 1 //200

const TARGET_ROOMS_PER_HOTEL = 100
const TARGET_ROOMS = TARGET_HOTELS * TARGET_ROOMS_PER_HOTEL // 20K

const TARGET_LEDGERS = _200M
const TARGET_LEDGERS_PER_ROOM = 10 // TARGET_LEDGERS / TARGET_ROOMS // 10K

//const MAX_ENTRIES_PER_JSON_FILE = _1M // basically 1 JSON file per Hotel

// https://2ality.com/2019/11/nodejs-streams-async-iteration.html#writing-to-writable-streams

const writeStreamReg: Record<string, Writeable> = {}

class Writeable {
  symbol: symbol = Symbol()

	constructor(public writeStream: WriteStream) {
		this.writeStream.on('error', (err) => console.log(err))
    writeStreamReg[this.symbol as unknown as string] = this
	}

	async write(chunk: string) {
		if (!this.writeStream.write(chunk)) {
			await once(this.writeStream, 'drain')
		}
	}

  async finish() {
    delete writeStreamReg[this.symbol as unknown as string]
    this.writeStream.end();
    await pFinished(this.writeStream)
  }
}

const main = async () => {
	let iHotel = 1
	while (iHotel <= TARGET_HOTELS) {
		// 1 JSON file per Hotel, so just one writeStream
		// streams are important when writing to large files
		console.log(__dirname)
		const writeable = new Writeable(
			createWriteStream(
				//'/root/work/data/dgraph/scripts/load-test/json/' +
        'dist/' +
				NameString(SubjectType.Hotel, iHotel) + '.json', { encoding: 'utf8', flags: 'a' }
			)
		)
		await writeable.write('{"set":[')
		await writeable.write(JSON.stringify(Hotel(iHotel)) + ',')

		let iRoom = 1
		while (iRoom <= TARGET_ROOMS_PER_HOTEL) {
			await writeable.write(JSON.stringify(Room(iRoom, iHotel)) + ',')
			let iLedger = 1
			while (iLedger <= TARGET_LEDGERS_PER_ROOM) {
				await writeable.write(
					JSON.stringify(Ledger(iLedger, iHotel, iRoom)) + ','
				)
				//console.log('iLedger:', iLedger)
				iLedger++
			}
			console.log('iRoom:', iRoom)
			iRoom++
		}
		// just to make sure we don't have a comma at the end of the list, we put in an extra 1 ledger per Hotel
		await writeable.write(
			JSON.stringify(
				Ledger(TARGET_LEDGERS_PER_ROOM + 1, iHotel, TARGET_ROOMS_PER_HOTEL)
			)
		)
		await writeable.write(']}')
    await writeable.finish()

		console.log('iHotel:', iHotel)
		iHotel++
	}
  
  process.exit()
}

process.stdin.resume();//so the program will not close instantly

function exitHandler(options: any, exitCode: any) {
    Object.values(writeStreamReg).map(v => v.finish())
    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

main()
