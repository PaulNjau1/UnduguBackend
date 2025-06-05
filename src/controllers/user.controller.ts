import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { apiResponse } from '../utils/apiResponse';
import { hashPassword } from '../utils/auth';
import { Role } from '@prisma/client';

// Create a new user
export const createUser = async (req: Request, res: Response): Promise<Response> => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: passwordHash,
      role: role || Role.FARMER,
    },
  });

  return apiResponse(res, 201, 'User created', { id: user.id, email: user.email, name: user.name, role: user.role });
};

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return apiResponse(res, 200, 'List of users', users);
};

// Get one user
export const getUserById = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!user) return res.status(404).json({ message: 'User not found' });

  return apiResponse(res, 200, 'User fetched', user);
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  const { name, email, role } = req.body;

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, email, role },
  });

  return apiResponse(res, 200, 'User updated', user);
};

// Delete user
export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params; // Get the user ID from the request parameters

  try {
    // IMPORTANT: First, delete all sessions associated with this user
    await prisma.session.deleteMany({
      where: {
        userId: id,
      },
    });

    // Now, delete the user
    const deletedUser = await prisma.user.delete({
      where: {
        id: id,
      },
    });

    // This check might be redundant if P2025 is caught, but good for clarity
    if (!deletedUser) {
      // If the user was not found, deletedUser would be null/undefined,
      // though Prisma usually throws P2025 if no record matches 'where'
      return apiResponse(res, 404, 'User not found.');
    }

    return apiResponse(res, 200, 'User and associated sessions deleted successfully.');
  } catch (error: any) {
    console.error("Error deleting user:", error);

    // Prisma specific error for not found (if ID is wrong after session deletion)
    if (error.code === 'P2025') {
      return apiResponse(res, 404, 'User not found or already deleted.');
    }
    // Foreign key constraint violation error (P2003) is what you're getting,
    // this block should now ideally not be hit if sessions are deleted first.
    // However, if there are OTHER foreign key constraints (e.g., User owns Farms, User owns Batches)
    // that don't have cascade delete, this error might still appear for them.
    if (error.code === 'P2003') {
        return apiResponse(res, 409, `Conflict: Cannot delete user due to existing related data. Constraint: ${error.meta.constraint}`);
    }

    return apiResponse(res, 500, 'Failed to delete user.', { error: error.message });
  }
};