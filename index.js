"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var randomNumber = function (min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
};
var randomAmount = function () { return randomNumber(100, 10000); };
var randomDate = function (start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
var randomRelevantDate = function () {
    return randomDate(new Date('1995-01-01T08:00:00+08:00'), new Date());
};
var SubjectType;
(function (SubjectType) {
    SubjectType["Hotel"] = "Hotel";
    SubjectType["Room"] = "Room";
    SubjectType["Ledger"] = "Ledger";
})(SubjectType || (SubjectType = {}));
var UIDString = function (type, i) { return '_:' + type + i; };
var UIDObj = function (type, i) { return ({
    uid: UIDString(type, i)
}); };
var NameString = function (type, i) { return type + i; };
// 200 Hotels altogether
var Hotel = function (i) { return ({
    uid: UIDString(SubjectType.Hotel, i),
    name: NameString(SubjectType.Hotel, i)
}); };
// 200 * 100 = 20,000 Rooms altogether
// 100 Rooms per Hotel
var Room = function (i, iHotel) { return ({
    uid: UIDString(SubjectType.Room, i),
    hotel: UIDObj(SubjectType.Hotel, iHotel),
    name: NameString(SubjectType.Room, i)
}); };
// 200M Ledgers altogether
// 200M / 200 = 1M Ledgers per Hotel
// 200M / (200 * 100) = 10K Ledgers per Room
var Ledger = function (i, iHotel, iRoom) { return ({
    uid: UIDString(SubjectType.Ledger, i),
    hotel: UIDObj(SubjectType.Hotel, iHotel),
    room: UIDObj(SubjectType.Room, iRoom),
    createdTs: randomRelevantDate(),
    amount: randomAmount()
}); };
// to save us from typos
var _200M = 200000000;
var _1M = 1000000;
var TARGET_HOTELS = 200;
var TARGET_ROOMS_PER_HOTEL = 100;
var TARGET_ROOMS = TARGET_HOTELS * TARGET_ROOMS_PER_HOTEL; // 20K
var TARGET_LEDGERS = _200M;
var TARGET_LEDGERS_PER_ROOM = TARGET_LEDGERS / TARGET_ROOMS; // 10K
//const MAX_ENTRIES_PER_JSON_FILE = _1M // basically 1 JSON file per Hotel
var main = function () {
    var iHotel = 1;
    var _loop_1 = function () {
        // 1 JSON file per Hotel, so just one writeStream
        // streams are important when writing to large files
        var stream = fs_1.createWriteStream('~/work/data/dgraph/scripts/load-test/json/' +
            NameString(SubjectType.Hotel, iHotel) +
            '.json');
        stream.on('open', function () {
            stream.write('{"set":[');
            stream.write(JSON.stringify(Hotel(iHotel)) + ',');
            var iRoom = 1;
            while (iRoom < TARGET_ROOMS_PER_HOTEL) {
                stream.write(JSON.stringify(Room(iRoom, iHotel)) + ',');
                var iLedger = 1;
                while (iLedger < TARGET_LEDGERS_PER_ROOM) {
                    stream.write(JSON.stringify(Ledger(iLedger, iHotel, iRoom)) + ',');
                    console.log('iLedger:', iLedger);
                    iLedger++;
                }
                console.log('iRoom:', iRoom);
                iRoom++;
            }
            // just to make sure we don't have a comma at the end of the list, we put in an extra 1 ledger per Hotel
            stream.write(JSON.stringify(Ledger(TARGET_LEDGERS_PER_ROOM + 1, iHotel, TARGET_ROOMS_PER_HOTEL)));
            stream.write(']}');
        });
        console.log('iHotel:', iHotel);
        iHotel++;
    };
    while (iHotel < TARGET_HOTELS) {
        _loop_1();
    }
};
