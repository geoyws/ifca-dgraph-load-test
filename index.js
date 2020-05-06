"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var fs_1 = require("fs");
var stream_1 = require("stream");
var events_1 = require("events");
var util_1 = require("util");
var pFinished = util_1.promisify(stream_1.finished);
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
var TARGET_HOTELS = 1; //200
var TARGET_ROOMS_PER_HOTEL = 100;
var TARGET_ROOMS = TARGET_HOTELS * TARGET_ROOMS_PER_HOTEL; // 20K
var TARGET_LEDGERS = _200M;
var TARGET_LEDGERS_PER_ROOM = TARGET_LEDGERS / TARGET_ROOMS; // 10K
//const MAX_ENTRIES_PER_JSON_FILE = _1M // basically 1 JSON file per Hotel
// https://2ality.com/2019/11/nodejs-streams-async-iteration.html#writing-to-writable-streams
var Writeable = /** @class */ (function () {
    function Writeable(writeStream) {
        this.writeStream = writeStream;
    }
    Writeable.prototype.write = function (chunk) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.writeStream.write(chunk)) return [3 /*break*/, 2];
                        return [4 /*yield*/, events_1.once(this.writeStream, 'drain')];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    return Writeable;
}());
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var iHotel, writeable, iRoom, iLedger;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                iHotel = 1;
                _a.label = 1;
            case 1:
                if (!(iHotel <= TARGET_HOTELS)) return [3 /*break*/, 12];
                writeable = new Writeable(fs_1.createWriteStream('~/work/data/dgraph/scripts/load-test/json/' +
                    NameString(SubjectType.Hotel, iHotel) +
                    '.json'));
                return [4 /*yield*/, writeable.write('{"set":[')];
            case 2:
                _a.sent();
                return [4 /*yield*/, writeable.write(JSON.stringify(Hotel(iHotel)) + ',')];
            case 3:
                _a.sent();
                iRoom = 1;
                _a.label = 4;
            case 4:
                if (!(iRoom <= TARGET_ROOMS_PER_HOTEL)) return [3 /*break*/, 9];
                return [4 /*yield*/, writeable.write(JSON.stringify(Room(iRoom, iHotel)) + ',')];
            case 5:
                _a.sent();
                iLedger = 1;
                _a.label = 6;
            case 6:
                if (!(iLedger <= TARGET_LEDGERS_PER_ROOM)) return [3 /*break*/, 8];
                return [4 /*yield*/, writeable.write(JSON.stringify(Ledger(iLedger, iHotel, iRoom)) + ',')];
            case 7:
                _a.sent();
                console.log('iLedger:', iLedger);
                iLedger++;
                return [3 /*break*/, 6];
            case 8:
                console.log('iRoom:', iRoom);
                iRoom++;
                return [3 /*break*/, 4];
            case 9: 
            // just to make sure we don't have a comma at the end of the list, we put in an extra 1 ledger per Hotel
            return [4 /*yield*/, writeable.write(JSON.stringify(Ledger(TARGET_LEDGERS_PER_ROOM + 1, iHotel, TARGET_ROOMS_PER_HOTEL)))];
            case 10:
                // just to make sure we don't have a comma at the end of the list, we put in an extra 1 ledger per Hotel
                _a.sent();
                return [4 /*yield*/, writeable.write(']}')];
            case 11:
                _a.sent();
                console.log('iHotel:', iHotel);
                iHotel++;
                return [3 /*break*/, 1];
            case 12: return [2 /*return*/];
        }
    });
}); };
main();
