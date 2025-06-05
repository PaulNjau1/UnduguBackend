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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPolling = startPolling;
const axios_1 = __importDefault(require("axios"));
const client_1 = __importDefault(require("../prisma/client"));
const THINGSPEAK_URL = 'https://api.thingspeak.com/channels/2775726/feeds.json?api_key=RC7EN8GT2LYO4N4O&results=5';
function pollThingSpeakAndSave(batchId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(THINGSPEAK_URL);
            const feeds = response.data.feeds;
            for (const feed of feeds) {
                // Check if reading exists (using entryId)
                const exists = yield client_1.default.spindelReading.findUnique({
                    where: { entryId: feed.entry_id },
                });
                if (!exists) {
                    // Create new reading
                    yield client_1.default.spindelReading.create({
                        data: {
                            entryId: feed.entry_id,
                            batchId,
                            createdAt: new Date(feed.created_at),
                            angleTilt: parseFloat(feed.field1),
                            temperature: parseFloat(feed.field2),
                            unit: feed.field3 || '',
                            battery: parseFloat(feed.field4),
                            gravity: parseFloat(feed.field5),
                            interval: parseInt(feed.field6),
                            rssi: parseInt(feed.field7),
                            ssid: feed.field8 || null,
                        },
                    });
                }
            }
            console.log('ThingSpeak polling done.');
        }
        catch (error) {
            console.error('Error polling ThingSpeak:', error);
        }
    });
}
// To run polling every 5 minutes:
function startPolling(batchId) {
    pollThingSpeakAndSave(batchId); // initial run
    setInterval(() => pollThingSpeakAndSave(batchId), 5 * 60 * 1000);
}
