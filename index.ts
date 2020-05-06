import { createWriteStream } from 'fs'

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

const TARGET_HOTELS = 200

const TARGET_ROOMS_PER_HOTEL = 100
const TARGET_ROOMS = TARGET_HOTELS * TARGET_ROOMS_PER_HOTEL // 20K

const TARGET_LEDGERS = _200M
const TARGET_LEDGERS_PER_ROOM = TARGET_LEDGERS / TARGET_ROOMS // 10K

//const MAX_ENTRIES_PER_JSON_FILE = _1M // basically 1 JSON file per Hotel

const main = () => {
	let iHotel = 1
	while (iHotel < TARGET_HOTELS) {
		// 1 JSON file per Hotel, so just one writeStream
		// streams are important when writing to large files
		const stream = createWriteStream(
			'~/work/data/dgraph/scripts/load-test/json/' +
				NameString(SubjectType.Hotel, iHotel) +
				'.json'
		)
		stream.on('open', () => {
			stream.write('{"set":[')
			stream.write(JSON.stringify(Hotel(iHotel)) + ',')
			let iRoom = 1
			while (iRoom < TARGET_ROOMS_PER_HOTEL) {
				stream.write(JSON.stringify(Room(iRoom, iHotel)) + ',')
				let iLedger = 1
				while (iLedger < TARGET_LEDGERS_PER_ROOM) {
					stream.write(JSON.stringify(Ledger(iLedger, iHotel, iRoom)) + ',')
					iLedger++
				}
				iRoom++
			}
			// just to make sure we don't have a comma at the end of the list, we put in an extra 1 ledger per Hotel
			stream.write(
				JSON.stringify(
					Ledger(TARGET_LEDGERS_PER_ROOM + 1, iHotel, TARGET_ROOMS_PER_HOTEL)
				)
			)
			stream.write(']}')
		})
		iHotel++
	}
}
