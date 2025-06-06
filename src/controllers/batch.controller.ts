// src/controllers/batchController.ts
import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { apiResponse } from '../utils/apiResponse';
import { Role } from '@prisma/client';

// (Ensure your express.d.ts or local declaration for Request.user is set up)

/**
 * Creates a new batch under a specific tank.
 * Ownership is verified by ensuring the tank belongs to the logged-in farmer.
 * Only farmers should be able to create batches for their tanks.
 */
export const createBatch = async (req: Request, res: Response) => {
  // Correctly extract user from req.user
  const currentUser = req.user;
  if (!currentUser) {
    return apiResponse(res, 401, 'Unauthorized: User not authenticated.');
  }

  const { tankId, batchCode, coffeeVariety, weightKg, startDate, endDate, isActive } = req.body;

  const parsedWeightKg = parseFloat(weightKg);

  if (isNaN(parsedWeightKg)) {
    return apiResponse(res, 400, 'Invalid input for weightKg. Must be a number.');
  }

  try {
    // Check tank ownership: Only the farmer who owns the tank can create a batch for it.
    // Admins can create for any tank.
    let isAuthorized = false;
    if (currentUser.role === Role.ADMIN) {
        isAuthorized = true; // Admin can create for any tank
    } else if (currentUser.role === Role.FARMER) {
        const tank = await prisma.tank.findFirst({
            where: {
                id: tankId,
                farm: { farmerId: currentUser.id }, // Check ownership for farmer
            },
        });
        isAuthorized = !!tank; // True if tank is found and owned by the farmer
    } else {
        return apiResponse(res, 403, 'Forbidden: Only farmers and admins can create batches.');
    }

    if (!isAuthorized) {
        return apiResponse(res, 403, 'Forbidden: You do not have permission to create a batch for this tank.');
    }

    const batch = await prisma.batch.create({
      data: {
        tankId,
        batchCode,
        coffeeVariety,
        weightKg: parsedWeightKg,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    return apiResponse(res, 201, 'Batch created successfully', batch);

  } catch (error) {
    console.error('Error creating batch:', error);
    return apiResponse(res, 500, 'Failed to create batch. Please try again.');
  }
};

/**
 * Retrieves batches based on user role:
 * - Farmers see only batches associated with their owned tanks.
 * - Undugu employees and Admins see all batches in the system.
 */
export const getMyBatches = async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser) {
    return apiResponse(res, 401, 'Unauthorized: User not authenticated.');
  }

  let whereClause: any = {};

  // Apply filtering based on user role
  if (currentUser.role === Role.FARMER) {
    whereClause = {
      tank: {
        farm: {
          farmerId: currentUser.id, // Filter by the farmer's ID
        },
      },
    };
  }
  // If currentUser.role is ADMIN or UNDUGU, whereClause remains empty,
  // which will return all batches as desired.

  try {
    const batches = await prisma.batch.findMany({
      where: whereClause,
      include: {
        tank: {
          include: {
            farm: true, // Include the associated farm for display on frontend
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Order by creation date (optional, but good practice)
      },
    });
    return apiResponse(res, 200, 'Batches fetched successfully', batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    return apiResponse(res, 500, 'Failed to retrieve batches. Please try again later.');
  }
};

/**
 * Retrieves a single batch by ID.
 * - Farmers can only access their own batches.
 * - Undugu employees and Admins can access any batch.
 */
export const getBatchById = async (req: Request, res: Response) => {
  const batchId = req.params.id;
  const currentUser = req.user;
  if (!currentUser) {
    return apiResponse(res, 401, 'Unauthorized: User not authenticated.');
  }

  let batchWhereClause: any = { id: batchId };

  // Apply ownership check only for farmers
  if (currentUser.role === Role.FARMER) {
    batchWhereClause = {
      id: batchId,
      tank: { farm: { farmerId: currentUser.id } }, // Farmer must own the tank associated with the batch
    };
  }

  try {
    const batch = await prisma.batch.findFirst({
      where: batchWhereClause,
      include: {
        tank: {
          include: {
            farm: true, // Include farm data
          },
        },
      },
    });

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found or you do not have permission to access it.' });
    }
    return apiResponse(res, 200, 'Batch fetched successfully', batch);
  } catch (error) {
    console.error(`Error fetching batch ${batchId}:`, error);
    return apiResponse(res, 500, 'Failed to retrieve batch. Please try again.');
  }
};

/**
 * Updates an existing batch.
 * Only the farmer who owns the batch (via tank/farm) or an Admin/Undugu can update it.
 */
export const updateBatch = async (req: Request, res: Response) => {
  const batchId = req.params.id;
  const { batchCode, coffeeVariety, weightKg, startDate, endDate, isActive } = req.body;
  const currentUser = req.user;
  if (!currentUser) {
    return apiResponse(res, 401, 'Unauthorized: User not authenticated.');
  }

  let parsedWeightKg: number | undefined;
  if (weightKg !== undefined) {
      parsedWeightKg = parseFloat(weightKg);
      if (isNaN(parsedWeightKg)) {
          return apiResponse(res, 400, 'Invalid input for weightKg. Must be a number.');
      }
  }

  let updateWhereClause: any = { id: batchId };

  // Only apply ownership check for farmers
  if (currentUser.role === Role.FARMER) {
    updateWhereClause = {
      id: batchId,
      tank: { farm: { farmerId: currentUser.id } }, // Farmer must own the associated tank
    };
  }

  try {
    const updated = await prisma.batch.updateMany({
      where: updateWhereClause,
      data: {
        batchCode,
        coffeeVariety,
        weightKg: parsedWeightKg,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        isActive,
      },
    });

    if (updated.count === 0) {
      return res.status(404).json({ message: 'Batch not found or you do not have permission to update it.' });
    }
    return apiResponse(res, 200, 'Batch updated successfully');
  } catch (error) {
    console.error(`Error updating batch ${batchId}:`, error);
    return apiResponse(res, 500, 'Failed to update batch. Please try again.');
  }
};

/**
 * Deletes a batch.
 * Only the farmer who owns the batch (via tank/farm) or an Admin/Undugu can delete it.
 */
export const deleteBatch = async (req: Request, res: Response) => {
  const batchId = req.params.id;
  const currentUser = req.user;
  if (!currentUser) {
    return apiResponse(res, 401, 'Unauthorized: User not authenticated.');
  }

  let deleteWhereClause: any = { id: batchId };

  // Only apply ownership check for farmers
  if (currentUser.role === Role.FARMER) {
    deleteWhereClause = {
      id: batchId,
      tank: { farm: { farmerId: currentUser.id } }, // Farmer must own the associated tank
    };
  }

  try {
    const deleted = await prisma.batch.deleteMany({
      where: deleteWhereClause,
    });

    if (deleted.count === 0) {
      return res.status(404).json({ message: 'Batch not found or you do not have permission to delete it.' });
    }
    return apiResponse(res, 200, 'Batch deleted successfully');
  } catch (error) {
    console.error(`Error deleting batch ${batchId}:`, error);
    return apiResponse(res, 500, 'Failed to delete batch. Please try again.');
  }
};