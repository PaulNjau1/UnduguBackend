"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (err) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
    };
};
exports.validateRequest = validateRequest;
