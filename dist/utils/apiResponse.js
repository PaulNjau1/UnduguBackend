"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiResponse = void 0;
const apiResponse = (res, statusCode, message, data) => {
    return res.status(statusCode).json({
        status: statusCode,
        message,
        data,
    });
};
exports.apiResponse = apiResponse;
