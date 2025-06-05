// src/controllers/readingsController.ts

import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { apiResponse } from '../utils/apiResponse';
import { Role } from '@prisma/client';
 // Assuming Role enum is accessible

/**
 * Get all Spindel readings for a specific batch.
 * This controller includes authorization checks to ensure users can only access readings
 * for batches they are permitted to view (e.g., farmers for their own farm's tanks).
 */
export const getSpindelReadingsByBatchId = async (req: Request, res: Response) => {
  const { batchId } = req.params;
  const user = req.user as { id: string; role: Role }; // Authenticated user from middleware

  try {
    // First, find the batch to ensure it exists and to get its associated tank/farm
    const batch = await prisma.batch.findUnique({
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
      return apiResponse(res, 404, 'Batch not found.');
    }

    // Authorization check: Farmers can only see readings for batches in their assigned tanks.
    // Admins and other roles (if defined) can see all.
    if (user.role === Role.FARMER) {
      const isFarmerAssociated = await prisma.farm.findFirst({
        where: {
          id: batch.tank.farmId,
          farmerId: user.id,
        },
      });

      if (!isFarmerAssociated) {
        return apiResponse(res, 403, 'You do not have permission to view readings for this batch.');
      }
    } 
    // Fetch Spindel readings for the batch
    const readings = await prisma.spindelReading.findMany({
      where: { batchId },
      orderBy: {
        createdAt: 'asc', // Order by creation date for charting purposes
      },
      // You can select specific fields if you don't need all of them to reduce payload size
      // select: {
      //   id: true,
      //   createdAt: true,
      //   gravity: true,
      //   temperature: true,
      //   angleTilt: true,
      //   battery: true,
      //   rssi: true,
      //   unit: true,
      // }
    });

    return apiResponse(res, 200, 'Spindel readings retrieved successfully', readings);
  } catch (error: any) {
    console.error('Error getting Spindel readings:', error);
    return apiResponse(res, 500, 'Failed to retrieve Spindel readings.', error.message);
  }
};

/**
 * Get a single Spindel reading by ID.
 * This is less common for charts but useful for debugging or specific data points.
 */



export const getSpindelReadingById = async (req: Request, res: Response) => {
  const { batchId } = req.params;
  const user = req.user as { id: string; role: Role };

  try {
    const reading = await prisma.spindelReading.findUnique({
      where: { id:batchId },
      include: {
        batch: {
          include: {
            tank: {
              include: {
                farm: true,
              },
            },
          },
        },
      },
    });

    if (!reading) {
      return apiResponse(res, 404, 'Spindel reading not found.');
    }

    // Authorization check (similar to getSpindelReadingsByBatchId)
    if (user.role === Role.FARMER) {
      const isFarmerAssociated = await prisma.farm.findFirst({
        where: {
          id: reading.batch.tank.farmId,
          farmerId: user.id,
        },
      });

      if (!isFarmerAssociated) {
        return apiResponse(res, 403, 'You do not have permission to view this Spindel reading.');
      }
    } 

    return apiResponse(res, 200, 'Spindel reading retrieved successfully', reading);
  } catch (error: any) {
    console.error('Error getting single Spindel reading:', error);
    return apiResponse(res, 500, 'Failed to retrieve Spindel reading.', error.message);
  }
};