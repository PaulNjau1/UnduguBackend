"use strict";
// server/src/controllers/auth.controller.ts
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
exports.logout = exports.refreshToken = exports.login = exports.signup = void 0;
const client_1 = __importDefault(require("../prisma/client")); // Your initialized Prisma client instance
const auth_1 = require("../utils/auth"); // Utility functions for auth logic
const apiResponse_1 = require("../utils/apiResponse"); // Your custom API response utility
const client_2 = require("@prisma/client"); // Assuming Role enum from your Prisma schema
// Signup new user
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { email, password, name, role, phone } = req.body; // Added 'phone' based on AuthPage.tsx
    // Basic validation (consider using a validation library like Zod for robust validation)
    if (!email || !password || !name) {
        return (0, apiResponse_1.apiResponse)(res, 400, 'Missing required fields: name, email, and password.');
    }
    try {
        // Check if user with this email already exists
        const existingUser = yield client_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return (0, apiResponse_1.apiResponse)(res, 409, 'Email already registered. Please login or use a different email.');
        }
        // Hash password before storing it
        const passwordHash = yield (0, auth_1.hashPassword)(password);
        // Create the new user in the database
        const newUser = yield client_1.default.user.create({
            data: {
                email,
                name,
                password: passwordHash,
                // Assign role; default to FARMER if not provided or invalid
                role: (Object.values(client_2.Role).includes(role) ? role : client_2.Role.FARMER),
                phone: phone || null, // Add phone, allowing it to be null if not provided
            },
            // Select specific fields to return, excluding sensitive information like password
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                phone: true, // Include phone in the returned user object
            }
        });
        // Generate access and refresh tokens for the newly registered user
        const accessToken = (0, auth_1.signAccessToken)(newUser.id); // Pass role to access token
        const refreshToken = (0, auth_1.signRefreshToken)(newUser.id);
        // Create a new session entry for the user using the refresh token
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Session expires in 7 days
        yield client_1.default.session.create({
            data: {
                userId: newUser.id,
                refreshToken: refreshToken, // Store the refresh token in the session
                userAgent: req.headers['user-agent'] || 'unknown', // Capture user agent from request headers
                expiresAt: expiresAt,
            },
        });
        // Respond with success, tokens, and the user object
        return (0, apiResponse_1.apiResponse)(res, 201, 'User registered successfully!', {
            accessToken,
            refreshToken,
            user: newUser, // Return the newly created user object
        });
    }
    catch (error) {
        console.error("Signup error:", error);
        // Handle potential Prisma errors (e.g., if phone was unique and duplicated)
        if (error.code === 'P2002' && ((_b = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes('email'))) {
            return (0, apiResponse_1.apiResponse)(res, 409, 'Email already exists. Please use a different email.');
        }
        return (0, apiResponse_1.apiResponse)(res, 500, 'Error registering user.', { error: error.message });
    }
});
exports.signup = signup;
// Login user
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, userAgent } = req.body;
    if (!email || !password) {
        return (0, apiResponse_1.apiResponse)(res, 400, 'Email and password are required.');
    }
    try {
        // Find the user by email
        const user = yield client_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return (0, apiResponse_1.apiResponse)(res, 401, 'Invalid credentials.');
        }
        // Verify the provided password against the stored hash
        const validPassword = yield (0, auth_1.verifyPassword)(password, user.password);
        if (!validPassword) {
            return (0, apiResponse_1.apiResponse)(res, 401, 'Invalid credentials.');
        }
        // Generate new access and refresh tokens
        const accessToken = (0, auth_1.signAccessToken)(user.id); // Pass role to access token
        const refreshToken = (0, auth_1.signRefreshToken)(user.id);
        // Calculate expiration time for the session
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        // Store the new refresh token as a session. Consider invalidating old sessions
        // or implementing a more robust session management (e.g., single active session per user).
        yield client_1.default.session.create({
            data: {
                userId: user.id,
                refreshToken: refreshToken, // Store the new refresh token
                userAgent: userAgent || 'unknown',
                expiresAt: expiresAt,
            },
        });
        // Prepare user data to send back, excluding the password
        const userWithoutPassword = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            phone: user.phone, // Include phone as it's not sensitive
        };
        // Respond with success, tokens, and the user object
        return (0, apiResponse_1.apiResponse)(res, 200, 'Login successful!', {
            accessToken,
            refreshToken,
            user: userWithoutPassword, // Return the user object without password
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return (0, apiResponse_1.apiResponse)(res, 500, 'Login failed. Please try again later.', { error: error.message });
    }
});
exports.login = login;
// Refresh tokens
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken: token, userAgent } = req.body; // Extract refresh token and userAgent
    if (!token)
        return (0, apiResponse_1.apiResponse)(res, 400, 'Refresh token is required.');
    try {
        // Verify the refresh token's authenticity and expiration
        const payload = (0, auth_1.verifyRefreshToken)(token);
        // Find the session associated with this refresh token and user ID
        const session = yield client_1.default.session.findFirst({
            where: {
                userId: payload.userId,
                refreshToken: token,
                expiresAt: {
                    gt: new Date(), // Ensure the session is not expired
                }
            },
            include: { user: true } // Include user to get role for access token
        });
        if (!session || !session.user) {
            return (0, apiResponse_1.apiResponse)(res, 403, 'Invalid or expired refresh token session.');
        }
        // Issue new access and refresh tokens
        const newAccessToken = (0, auth_1.signAccessToken)(session.user.id); // Use user role for access token
        const newRefreshToken = (0, auth_1.signRefreshToken)(session.user.id);
        // Update the existing session with the new refresh token
        // This is a common strategy to ensure refresh tokens are single-use (rotate them)
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Extend session for another 7 days
        yield client_1.default.session.update({
            where: { id: session.id },
            data: {
                refreshToken: newRefreshToken,
                userAgent: userAgent || session.userAgent, // Update user agent or keep old if not provided
                expiresAt: newExpiresAt,
            },
        });
        return (0, apiResponse_1.apiResponse)(res, 200, 'Tokens refreshed successfully!', {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    }
    catch (error) {
        console.error("Refresh token error:", error);
        // If verifyRefreshToken throws an error (e.g., token expired/invalid signature)
        return (0, apiResponse_1.apiResponse)(res, 403, 'Invalid or expired refresh token.', { error: error.message });
    }
});
exports.refreshToken = refreshToken;
// Logout (revoke refresh token and associated session)
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken: token } = req.body; // Expect the refresh token in the request body
    if (!token)
        return (0, apiResponse_1.apiResponse)(res, 400, 'Refresh token is required for logout.');
    try {
        // Delete all sessions matching the provided refresh token
        // This effectively logs out the user from the specific session associated with this token
        const deleteResult = yield client_1.default.session.deleteMany({
            where: { refreshToken: token }
        });
        if (deleteResult.count === 0) {
            // If no sessions were found, it means the token was already invalid or session didn't exist
            return (0, apiResponse_1.apiResponse)(res, 404, 'Session not found or already logged out.');
        }
        return (0, apiResponse_1.apiResponse)(res, 200, 'Logged out successfully!');
    }
    catch (error) {
        console.error("Logout error:", error);
        return (0, apiResponse_1.apiResponse)(res, 500, 'Failed to logout. Please try again.', { error: error.message });
    }
});
exports.logout = logout;
