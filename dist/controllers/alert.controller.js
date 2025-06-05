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
exports.deleteAlert = exports.updateAlert = exports.createAlert = exports.getAlertById = exports.getAllAlerts = exports.getAlertsByBatchId = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const alert_validation_1 = require("../validators/alert.validation");
const client_2 = require("@prisma/client");
const apiResponse_1 = require("../utils/apiResponse");
const getAlertsByBatchId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { batchId } = req.params;
    const user = req.user; // Authenticated user from middleware
    try {
        // First, find the batch to ensure it exists and to get its associated tank/farm
        const batch = yield client_1.default.batch.findUnique({
            where: { id: batchId },
            include: {
                tank: {
                    include: {
                        farm: true,
                    },
                },
            },
        });
        if (!batch) {
            return (0, apiResponse_1.apiResponse)(res, 404, "Batch not found.");
        }
        // Authorization check: Farmers can only see alerts for batches in their assigned tanks.
        // Admins and other roles (if defined) can see all.
        if (user.role === client_2.Role.FARMER) {
            const isFarmerAssociated = yield client_1.default.farm.findFirst({
                where: {
                    id: batch.tank.farmId,
                    farmerId: user.id,
                },
            });
            if (!isFarmerAssociated) {
                return (0, apiResponse_1.apiResponse)(res, 403, "You do not have permission to view alerts for this batch.");
            }
        }
        // Fetch alerts for the batch, ordered by creation date (descending)
        const alerts = yield client_1.default.alert.findMany({
            where: { batchId },
            orderBy: {
                createdAt: "desc", // Most recent alerts first
            },
        });
        return (0, apiResponse_1.apiResponse)(res, 200, "Alerts retrieved successfully", alerts);
    }
    catch (error) {
        console.error("Error getting alerts by batch ID:", error);
        return (0, apiResponse_1.apiResponse)(res, 500, "Failed to retrieve alerts.", error.message);
    }
});
exports.getAlertsByBatchId = getAlertsByBatchId;
const getAllAlerts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const alerts = yield client_1.default.alert.findMany({
            include: {
                batch: true,
                reading: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.status(200).json(alerts);
    }
    catch (err) {
        next(err);
    }
});
exports.getAllAlerts = getAllAlerts;
const getAlertById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const alert = yield client_1.default.alert.findUnique({
            where: { id: req.params.id },
            include: {
                batch: true,
                reading: true,
            },
        });
        if (!alert)
            return res.status(404).json({ message: "Alert not found" });
        res.status(200).json(alert);
    }
    catch (err) {
        next(err);
    }
});
exports.getAlertById = getAlertById;
const createAlert = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validated = alert_validation_1.createAlertSchema.parse(req.body);
        const alert = yield client_1.default.alert.create({
            data: validated,
        });
        res.status(201).json(alert);
    }
    catch (err) {
        next(err);
    }
});
exports.createAlert = createAlert;
const updateAlert = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validated = alert_validation_1.updateAlertSchema.parse(req.body);
        const existing = yield client_1.default.alert.findUnique({
            where: { id: req.params.id },
        });
        if (!existing)
            return res.status(404).json({ message: "Alert not found" });
        const updated = yield client_1.default.alert.update({
            where: { id: req.params.id },
            data: validated,
        });
        res.status(200).json(updated);
    }
    catch (err) {
        next(err);
    }
});
exports.updateAlert = updateAlert;
const deleteAlert = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleted = yield client_1.default.alert.delete({
            where: { id: req.params.id },
        });
        res.status(200).json({ message: "Alert deleted", alert: deleted });
    }
    catch (err) {
        next(err);
    }
});
exports.deleteAlert = deleteAlert;
