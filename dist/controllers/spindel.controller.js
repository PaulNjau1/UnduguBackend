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
exports.stopFermentation = exports.startFermentation = exports.pollSpindelForBatch = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const apiResponse_1 = require("../utils/apiResponse");
const axios_1 = __importDefault(require("axios"));
const checkForAlerts = (reading) => {
    const alerts = [];
    // Temperature range alert (°C)
    if (reading.temperature < 15 || reading.temperature > 30) {
        alerts.push("Temperature out of range (15-30°C)");
    }
    // Gravity typical fermentation range (specific gravity)
    if (reading.gravity < 1.0 || reading.gravity > 1.2) {
        alerts.push("Gravity out of range (1.000-1.200)");
    }
    // Battery low alert (volts)
    if (reading.battery < 3.0) {
        alerts.push("Low battery voltage");
    }
    // Tilt angle abnormal (e.g., device lying flat or upside down)
    if (reading.angleTilt < 0 || reading.angleTilt > 360) {
        alerts.push("Angle tilt out of expected range (0-360°)");
    }
    // RSSI (signal strength) very low (arbitrary threshold, e.g., below -80 dBm)
    if (reading.rssi < -80) {
        alerts.push("Weak signal strength (RSSI)");
    }
    // Optionally, check for missing SSID (WiFi)
    if (!reading.ssid) {
        alerts.push("WiFi SSID not detected");
    }
    return alerts;
};
// Function to poll iSpindel API and save readings
const pollSpindelForBatch = (batchId) => __awaiter(void 0, void 0, void 0, function* () {
    const batch = yield client_1.default.batch.findUnique({
        where: { id: batchId },
        include: { tank: true },
    });
    if (!batch || !batch.isActive || !batch.tank.spindelApiUrl)
        return;
    try {
        const url = batch.tank.spindelApiUrl;
        const { data } = yield axios_1.default.get(url);
        for (const feed of data.feeds || []) {
            const entryId = parseInt(feed.entry_id);
            const exists = yield client_1.default.spindelReading.findUnique({
                where: { entryId },
            });
            if (exists)
                continue;
            const newReading = yield client_1.default.spindelReading.create({
                data: {
                    entryId,
                    createdAt: new Date(feed.created_at),
                    angleTilt: parseFloat(feed.field1),
                    temperature: parseFloat(feed.field2),
                    unit: feed.field3,
                    battery: parseFloat(feed.field4),
                    gravity: parseFloat(feed.field5),
                    interval: parseInt(feed.field6),
                    rssi: parseInt(feed.field7),
                    ssid: feed.field8 || null,
                    batchId: batch.id,
                },
            });
            const alerts = checkForAlerts(newReading);
            if (alerts.length > 0) {
                yield client_1.default.alert.create({
                    data: {
                        batchId: batch.id,
                        readingId: newReading.id,
                        level: "WARNING",
                        message: alerts.join("; "),
                    },
                });
            }
        }
    }
    catch (err) {
        console.error(`Failed to poll for batch ${batchId}:`, err.message);
    }
});
exports.pollSpindelForBatch = pollSpindelForBatch;
// Start fermentation
const startFermentation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { batchId } = req.body;
    const batch = yield client_1.default.batch.update({
        where: { id: batchId },
        data: { isActive: true, startDate: new Date() },
    });
    // You can immediately poll once here
    yield (0, exports.pollSpindelForBatch)(batchId);
    return (0, apiResponse_1.apiResponse)(res, 200, "Fermentation started and polling initiated", batch);
});
exports.startFermentation = startFermentation;
// End fermentation
const stopFermentation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { batchId } = req.body;
    const batch = yield client_1.default.batch.update({
        where: { id: batchId },
        data: { isActive: false, endDate: new Date() },
    });
    return (0, apiResponse_1.apiResponse)(res, 200, "Fermentation stopped", batch);
});
exports.stopFermentation = stopFermentation;
