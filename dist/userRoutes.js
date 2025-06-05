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
exports.default = userRoutes;
// src/userRoutes.ts
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const authMiddleware_1 = require("./authMiddleware");
const router = (0, express_1.Router)();
function userRoutes(prisma) {
    // Send email
    const transporter = nodemailer_1.default.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    // Register route
    router.post("/register", (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { username, email, password } = req.body;
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const verificationToken = crypto_1.default.randomBytes(20).toString("hex");
        try {
            // Check if the username or email already exists
            const existingUser = yield prisma.user.findFirst({
                where: {
                    OR: [{ username }, { email }],
                },
            });
            if (existingUser) {
                return res
                    .status(400)
                    .json({ message: "Username or email already taken" });
            }
            // Hash the password
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            // Create a verification token
            const verificationToken = crypto_1.default.randomBytes(20).toString("hex");
            // Create the new user
            const newUser = yield prisma.user.create({
                data: {
                    username,
                    email,
                    password: hashedPassword,
                    verificationToken,
                },
            });
            // Set up email transport
            const transporter = nodemailer_1.default.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
            const verificationUrl = `http://localhost:5000/api/verify-email/${verificationToken}`;
            yield transporter.sendMail({
                to: email,
                subject: "Email Verification",
                text: `Click on this link to verify your email: ${verificationUrl}`,
            });
            res.status(201).json({
                message: "User registered successfully. Verification email sent.",
            });
        }
        catch (error) {
            res
                .status(500)
                .json({ message: "Something went wrong during registration" });
        }
    }));
    // Verify Email
    router.get("/verify-email/:token", (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { token } = req.params;
        const user = yield prisma.user.findUnique({
            where: { verificationToken: token },
        });
        if (!user)
            return res.status(400).json({ message: "Invalid token" });
        yield prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, verificationToken: null },
        });
        res.json({ message: "Email verified successfully" });
    }));
    // Request Password Reset
    router.post("/request-reset", (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { email } = req.body;
        const user = yield prisma.user.findUnique({ where: { email: email } });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const token = crypto_1.default.randomBytes(20).toString("hex");
        yield prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: token,
                resetPasswordExpires: new Date(Date.now() + 3600000),
            },
        });
        const resetUrl = `http://localhost:5000/api/reset-password/${token}`;
        yield transporter.sendMail({
            to: user.email,
            subject: "Password Reset",
            text: `Click on this link to reset your password: ${resetUrl}`,
        });
        res.json({ message: "Password reset email sent" });
    }));
    // Reset Password
    router.post("/reset-password/:token", (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { token } = req.params;
        const { newPassword } = req.body;
        const user = yield prisma.user.findUnique({
            where: { resetPasswordToken: token },
        });
        if (!user ||
            (user.resetPasswordExpires && user.resetPasswordExpires < new Date())) {
            return res
                .status(400)
                .json({ message: "Token is invalid or has expired" });
        }
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        yield prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });
        res.json({ message: "Password has been reset" });
    }));
    // Login route
    router.post("/login", (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { username, password } = req.body;
        const user = yield prisma.user.findUnique({ where: { username } });
        if (!user || !(yield bcrypt_1.default.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const accessToken = jsonwebtoken_1.default.sign({ username: user.username }, process.env.JWT_SECRET, {
            expiresIn: "15m",
        });
        const refreshToken = jsonwebtoken_1.default.sign({ username: user.username }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        yield prisma.user.update({
            where: { id: user.id },
            data: { resetPasswordToken: refreshToken },
        });
        res.json({ accessToken, refreshToken });
    }));
    // Refresh Token Route
    router.post("/token", (req, res) => __awaiter(this, void 0, void 0, function* () {
        const { token } = req.body;
        if (!token)
            return res.sendStatus(401); // Unauthorized if no token is provided
        const user = yield prisma.user.findFirst({
            where: { resetPasswordToken: token },
        });
        if (!user)
            return res.sendStatus(403); // Forbidden if user not found
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err) => {
            if (err)
                return res.sendStatus(403); // Forbidden if token verification fails
            const accessToken = jsonwebtoken_1.default.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: "15m" });
            res.json({ accessToken });
        });
    }));
    //@ts-ignore//
    router.get('/profile', authMiddleware_1.authenticateJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const username = (_a = req.user) === null || _a === void 0 ? void 0 : _a.username; // Get the username from the JWT
            const user = yield prisma.user.findUnique({
                where: { username },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    isVerified: true,
                    // Include other fields you want to return
                }
            });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error retrieving profile' });
        }
    }));
    // Route to update user profile
    //@ts-ignore//
    router.put('/profile', authMiddleware_1.authenticateJWT, (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { email, username } = req.body; // Get updated fields from request body
        try {
            // Update the user's email and username
            const updatedUser = yield prisma.user.update({
                where: { username: (_a = req.user) === null || _a === void 0 ? void 0 : _a.username }, // Ensure the logged-in user is updating their profile
                data: {
                    email,
                    username,
                    // Update other fields as necessary
                },
            });
            res.json({ message: 'Profile updated successfully', user: updatedUser });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error updating profile' });
        }
    }));
    return router;
}
