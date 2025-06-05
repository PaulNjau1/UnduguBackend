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
const node_cron_1 = __importDefault(require("node-cron"));
const spindel_controller_1 = require("../controllers/spindel.controller");
const client_1 = __importDefault(require("../prisma/client"));
const startCronJobs = () => {
    // Schedule a cron job to run every minute (adjust the schedule as needed)
    node_cron_1.default.schedule('* * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        const batches = yield client_1.default.batch.findMany({ where: { isActive: true } });
        for (const batch of batches) {
            yield (0, spindel_controller_1.pollSpindelForBatch)(batch.id); // Call the function to poll data for each active batch
        }
        console.log('✅ Polled iSpindel data for active batches.');
    }));
};
exports.default = startCronJobs;
