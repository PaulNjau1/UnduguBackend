// server/src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import prisma from '../prisma/client'; // Your initialized Prisma client instance
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/auth'; // Utility functions for auth logic
import { apiResponse } from '../utils/apiResponse'; // Your custom API response utility
import { Role } from '@prisma/client'; // Assuming Role enum from your Prisma schema

// Signup new user
export const signup = async (req: Request, res: Response): Promise<Response> => {
  const { email, password, name, role, phone } = req.body; // Added 'phone' based on AuthPage.tsx

  // Basic validation (consider using a validation library like Zod for robust validation)
  if (!email || !password || !name) {
    return apiResponse(res, 400, 'Missing required fields: name, email, and password.');
  }

  try {
    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return apiResponse(res, 409, 'Email already registered. Please login or use a different email.');
    }

    // Hash password before storing it
    const passwordHash = await hashPassword(password);

    // Create the new user in the database
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: passwordHash,
        // Assign role; default to FARMER if not provided or invalid
        role: (Object.values(Role).includes(role as Role) ? role : Role.FARMER) as Role,
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
    const accessToken = signAccessToken(newUser.id); // Pass role to access token
    const refreshToken = signRefreshToken(newUser.id);

    // Create a new session entry for the user using the refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Session expires in 7 days
    await prisma.session.create({
      data: {
        userId: newUser.id,
        refreshToken: refreshToken, // Store the refresh token in the session
        userAgent: req.headers['user-agent'] || 'unknown', // Capture user agent from request headers
        expiresAt: expiresAt,
      },
    });

    // Respond with success, tokens, and the user object
    return apiResponse(res, 201, 'User registered successfully!', {
      accessToken,
      refreshToken,
      user: newUser, // Return the newly created user object
    });

  } catch (error: any) {
    console.error("Signup error:", error);
    // Handle potential Prisma errors (e.g., if phone was unique and duplicated)
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return apiResponse(res, 409, 'Email already exists. Please use a different email.');
    }
    return apiResponse(res, 500, 'Error registering user.', { error: error.message });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password, userAgent } = req.body;

  if (!email || !password) {
    return apiResponse(res, 400, 'Email and password are required.');
  }

  try {
    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return apiResponse(res, 401, 'Invalid credentials.');
    }

    // Verify the provided password against the stored hash
    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) {
      return apiResponse(res, 401, 'Invalid credentials.');
    }

    // Generate new access and refresh tokens
    const accessToken = signAccessToken(user.id); // Pass role to access token
    const refreshToken = signRefreshToken(user.id);

    // Calculate expiration time for the session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Store the new refresh token as a session. Consider invalidating old sessions
    // or implementing a more robust session management (e.g., single active session per user).
    await prisma.session.create({
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
    return apiResponse(res, 200, 'Login successful!', {
      accessToken,
      refreshToken,
      user: userWithoutPassword, // Return the user object without password
    });

  } catch (error: any) {
    console.error("Login error:", error);
    return apiResponse(res, 500, 'Login failed. Please try again later.', { error: error.message });
  }
};

// Refresh tokens
export const refreshToken = async (req: Request, res: Response): Promise<Response> => {
  const { refreshToken: token, userAgent } = req.body; // Extract refresh token and userAgent

  if (!token) return apiResponse(res, 400, 'Refresh token is required.');

  try {
    // Verify the refresh token's authenticity and expiration
    const payload = verifyRefreshToken(token);

    // Find the session associated with this refresh token and user ID
    const session = await prisma.session.findFirst({
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
      return apiResponse(res, 403, 'Invalid or expired refresh token session.');
    }

    // Issue new access and refresh tokens
    const newAccessToken = signAccessToken(session.user.id); // Use user role for access token
    const newRefreshToken = signRefreshToken(session.user.id);

    // Update the existing session with the new refresh token
    // This is a common strategy to ensure refresh tokens are single-use (rotate them)
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Extend session for another 7 days
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        userAgent: userAgent || session.userAgent, // Update user agent or keep old if not provided
        expiresAt: newExpiresAt,
      },
    });

    return apiResponse(res, 200, 'Tokens refreshed successfully!', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    console.error("Refresh token error:", error);
    // If verifyRefreshToken throws an error (e.g., token expired/invalid signature)
    return apiResponse(res, 403, 'Invalid or expired refresh token.', { error: error.message });
  }
};

// Logout (revoke refresh token and associated session)
export const logout = async (req: Request, res: Response): Promise<Response> => {
  const { refreshToken: token } = req.body; // Expect the refresh token in the request body

  if (!token) return apiResponse(res, 400, 'Refresh token is required for logout.');

  try {
    // Delete all sessions matching the provided refresh token
    // This effectively logs out the user from the specific session associated with this token
    const deleteResult = await prisma.session.deleteMany({
      where: { refreshToken: token }
    });

    if (deleteResult.count === 0) {
      // If no sessions were found, it means the token was already invalid or session didn't exist
      return apiResponse(res, 404, 'Session not found or already logged out.');
    }

    return apiResponse(res, 200, 'Logged out successfully!');
  } catch (error: any) {
    console.error("Logout error:", error);
    return apiResponse(res, 500, 'Failed to logout. Please try again.', { error: error.message });
  }
};