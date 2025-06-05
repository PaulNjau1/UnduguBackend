import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { apiResponse } from '../utils/apiResponse';
import { Role } from '@prisma/client';


// Extend the Request interface if not already done in authenticateToken.ts
// This ensures TypeScript recognizes req.user.role


/**
 * Creates a new batch under a specific tank.
 * Ownership is verified by ensuring the tank belongs to the logged-in farmer.
 * Only farmers should be able to create batches for their tanks.
 */
export const createBatch = async (req: Request, res: Response) => {
  const { tankId, batchCode, coffeeVariety, weightKg, startDate, endDate, isActive,user } = req.body;

  // --- FIX: Parse weightKg to a number ---
  const parsedWeightKg = parseFloat(weightKg);

  if (isNaN(parsedWeightKg)) {
    return apiResponse(res, 400, 'Invalid input for weightKg. Must be a number.');
  }
  // --- END FIX ---

  try {
    // Check tank ownership: Only the farmer who owns the tank can create a batch for it.
    const tank = await prisma.tank.findFirst({
      where: {
        id: tankId,
        farm: { farmerId: user.id }, // Ensure req.user exists and has an ID
      },
    });

  

    if (tank || user.role == 'ADMIN'){
      const batch = await prisma.batch.create({
        data: {
          tankId,
          batchCode,
          coffeeVariety,
          weightKg: parsedWeightKg, // Use the parsed number here
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          isActive: isActive !== undefined ? isActive : true, // Default to true if not provided
        },
      });
      return apiResponse(res, 201, 'Batch created successfully', batch);

    }

   
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
  let whereClause: any = {};
  const userRole = req.user?.role; // Get the role from the authenticated user

  // Apply filtering based on user role
  if (userRole === Role.FARMER) {
    whereClause = {
      tank: {
        farm: {
          farmerId: req.user?.id, // Filter by the farmer's ID
        },
      },
    };
  }
  // If userRole is ADMIN or UNDUGU, whereClause remains empty,
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
  const userRole = req.user?.role;
  const userId = req.user?.id;

  let batchWhereClause: any = { id: batchId };

  // Apply ownership check only for farmers
  if (userRole === Role.FARMER) {
    batchWhereClause = {
      id: batchId,
      tank: { farm: { farmerId: userId } }, // Farmer must own the tank associated with the batch
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
  const userRole = req.user?.role;
  const userId = req.user?.id;

  // --- FIX: Parse weightKg to a number if present in update ---
  let parsedWeightKg: number | undefined;
  if (weightKg !== undefined) {
      parsedWeightKg = parseFloat(weightKg);
      if (isNaN(parsedWeightKg)) {
          return apiResponse(res, 400, 'Invalid input for weightKg. Must be a number.');
      }
  }
  // --- END FIX ---

  let updateWhereClause: any = { id: batchId };

  // Only apply ownership check for farmers
  if (userRole === Role.FARMER) {
    updateWhereClause = {
      id: batchId,
      tank: { farm: { farmerId: userId } }, // Farmer must own the associated tank
    };
  }

  try {
    const updated = await prisma.batch.updateMany({
      where: updateWhereClause,
      data: {
        batchCode,
        coffeeVariety,
        weightKg: parsedWeightKg, // Use the parsed number here
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null, // Ensure null is passed if endDate is empty
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
  const userRole = req.user?.role;
  const userId = req.user?.id;

  let deleteWhereClause: any = { id: batchId };

  // Only apply ownership check for farmers
  if (userRole === Role.FARMER) {
    deleteWhereClause = {
      id: batchId,
      tank: { farm: { farmerId: userId } }, // Farmer must own the associated tank
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