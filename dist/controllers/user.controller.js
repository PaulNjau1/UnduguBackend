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
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getAllUsers = exports.createUser = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const apiResponse_1 = require("../utils/apiResponse");
const auth_1 = require("../utils/auth");
const client_2 = require("@prisma/client");
// Create a new user
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const existingUser = yield client_1.default.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
    }
    const passwordHash = yield (0, auth_1.hashPassword)(password);
    const user = yield client_1.default.user.create({
        data: {
            email,
            name,
            password: passwordHash,
            role: role || client_2.Role.FARMER,
        },
    });
    return (0, apiResponse_1.apiResponse)(res, 201, 'User created', { id: user.id, email: user.email, name: user.name, role: user.role });
});
exports.createUser = createUser;
// Get all users
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield client_1.default.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return (0, apiResponse_1.apiResponse)(res, 200, 'List of users', users);
});
exports.getAllUsers = getAllUsers;
// Get one user
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield client_1.default.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    return (0, apiResponse_1.apiResponse)(res, 200, 'User fetched', user);
});
exports.getUserById = getUserById;
// Update user
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, role } = req.body;
    const user = yield client_1.default.user.update({
        where: { id: req.params.id },
        data: { name, email, role },
    });
    return (0, apiResponse_1.apiResponse)(res, 200, 'User updated', user);
});
exports.updateUser = updateUser;
// Delete user
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // Get the user ID from the request parameters
    try {
        // IMPORTANT: First, delete all sessions associated with this user
        yield client_1.default.session.deleteMany({
            where: {
                userId: id,
            },
        });
        // Now, delete the user
        const deletedUser = yield client_1.default.user.delete({
            where: {
                id: id,
            },
        });
        // This check might be redundant if P2025 is caught, but good for clarity
        if (!deletedUser) {
            // If the user was not found, deletedUser would be null/undefined,
            // though Prisma usually throws P2025 if no record matches 'where'
            return (0, apiResponse_1.apiResponse)(res, 404, 'User not found.');
        }
        return (0, apiResponse_1.apiResponse)(res, 200, 'User and associated sessions deleted successfully.');
    }
    catch (error) {
        console.error("Error deleting user:", error);
        // Prisma specific error for not found (if ID is wrong after session deletion)
        if (error.code === 'P2025') {
            return (0, apiResponse_1.apiResponse)(res, 404, 'User not found or already deleted.');
        }
        // Foreign key constraint violation error (P2003) is what you're getting,
        // this block should now ideally not be hit if sessions are deleted first.
        // However, if there are OTHER foreign key constraints (e.g., User owns Farms, User owns Batches)
        // that don't have cascade delete, this error might still appear for them.
        if (error.code === 'P2003') {
            return (0, apiResponse_1.apiResponse)(res, 409, `Conflict: Cannot delete user due to existing related data. Constraint: ${error.meta.constraint}`);
        }
        return (0, apiResponse_1.apiResponse)(res, 500, 'Failed to delete user.', { error: error.message });
    }
});
exports.deleteUser = deleteUser;
