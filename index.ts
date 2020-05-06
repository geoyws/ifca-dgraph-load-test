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

// 200 Hotels altogether
const Hotel = (i: number, name: string) => ({
	uid: '_:hotel' + i,
	name,
})

// 200 * 100 = 20,000 Rooms altogether
// 100 Rooms per Hotel
const Room = (i: number, hotel: string, name: string) => ({
	uid: '_:room' + i,
	hotel,
	name,
})

// 200M Ledgers altogether
// 200M / 200 = 1M Ledgers per Hotel
// 200M / (200 * 100) = 10K Ledgers per Room
const Ledger = (i: number, hotel: string, room: string) => ({
	uid: '_:ledger' + i,
	hotel,
	room,
	createdTs: randomRelevantDate(),
	amount: randomAmount(),
})

// to save us from typos
const _200M = 200000000
const _2M = 2000000

let hotels = 200 // default value, param specifiable

let roomPerHotel = 100
let rooms = hotels * roomPerHotel

let ledgers = _200M
let ledgersPerRoom = ledgers / rooms

let iHotel = 0
let iRoom = 0
let iLedger = 0
let i_JSONFile = 1
let EntriesPerJSONFile = _2M // each

const writeToJSONFile = async (passed_i_JSONFile: number) => {
	const stream = createWriteStream(`${passed_i_JSONFile}.json`)
	stream.write('{"set":[')
	let i = 0
	while (i < _2M) {
		stream.write(JSON.stringify(Ledger()))
	}
	stream.write(']}')
}

// while i_entry is less than 200M
while (i_ledger < _200M) {
	writeToJSONFile(i_JSONFile)
	i_ledger += _2M
	i_JSONFile++
	console.log('i_entry:', i_ledger)
	console.log('i_JSONFile:', i_JSONFile)
}
