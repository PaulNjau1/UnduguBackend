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
exports.pollAllActiveBatches = void 0;
const spindel_controller_1 = require("../controllers/spindel.controller");
const client_1 = __importDefault(require("../prisma/client"));
const pollAllActiveBatches = () => __awaiter(void 0, void 0, void 0, function* () {
    const activeBatches = yield client_1.default.batch.findMany({
        where: { isActive: true },
        include: { tank: true },
    });
    for (const batch of activeBatches) {
        if (batch.tank.spindelApiUrl) {
            yield (0, spindel_controller_1.pollSpindelForBatch)(batch.id);
        }
    }
});
exports.pollAllActiveBatches = pollAllActiveBatches;
