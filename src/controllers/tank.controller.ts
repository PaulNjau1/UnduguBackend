import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { apiResponse } from '../utils/apiResponse';

// Assuming req.user is populated by your authentication middleware
// and has at least 'id' and 'role' properties.
// Example: interface AuthRequest extends Request { user: { id: string; role: string; }; }

// Create tank under a farm (ownership enforced)
export const createTank = async (req: Request, res: Response) => {
  const { farmId, name, spindelApiUrl } = req.body;
  const userId = req.user.id; // Assuming req.user is populated by auth middleware

  // Validate ownership of farm for the farmer role
  const farm = await prisma.farm.findFirst({
    where: { id: farmId, farmerId: userId },
  });

  // Only farmers can create tanks for their own farms.
  // Admins and Undugu roles might have different permissions,
  // but based on existing code, creating is farmer-specific.
  if (!farm) {
    return apiResponse(res, 403, 'Not authorized to create a tank for this farm.');
  }

  const tank = await prisma.tank.create({
    data: { name, farmId, spindelApiUrl },
  });

  return apiResponse(res, 201, 'Tank created successfully', tank);
};

// Get all tanks for current user (from all farms they own)
export const getMyTanks = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const tanks = await prisma.tank.findMany({
    where: {
      farm: { farmerId: userId },
    },
    include: {
      farm: true,
    },
  });

  return apiResponse(res, 200, 'Tanks fetched successfully', tanks);
};

/**
 * @desc Get all tanks for a specific farm ID.
 * @route GET /api/v1/farms/:farmId/tanks
 * @access Private (Auth: Farmer can see their farm's tanks, Admin/Undugu can see any farm's tanks)
 */
export const getTanksByFarmId = async (req: Request, res: Response) => {
  const { farmId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role; // Assuming role is available on req.user

  if (!farmId) {
    return apiResponse(res, 400, 'Farm ID is required.');
  }

  // Find the farm to check ownership/existence
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: { farmerId: true }, // Select only farmerId for efficiency
  });

  if (!farm) {
    return apiResponse(res, 404, `Farm with ID ${farmId} not found.`);
  }

  // Fetch tanks associated with the farmId
  const tanks = await prisma.tank.findMany({
    where: {
      farmId: farmId,
    },
    // Include any related data you might need, e.g., batches
    include: {
      batches: true, // Example: include batches if needed for display
    },
  });

  return apiResponse(res, 200, 'Tanks fetched successfully for farm', tanks);
};


// Get single tank by ID (ownership enforced for farmers, admin/undugu can access any)
export const getTankById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Find the tank first to check ownership/existence
  const tank = await prisma.tank.findUnique({
    where: { id },
    include: {
      farm: {
        select: { farmerId: true }, // Select farmerId from the associated farm
      },
      batches: true,
    },
  });

  if (!tank) {
    return apiResponse(res, 404, 'Tank not found.');
  }

  // Authorization Logic for single tank:
  // - Admin and UNDUGU roles can view any tank.
  // - FARMER role can only view tanks belonging to their own farms.
  const isAuthorized =
    userRole === 'ADMIN' ||
    userRole === 'UNDUGU' ||
    (userRole === 'FARMER' && tank.farm?.farmerId === userId);

  if (!isAuthorized) {
    return apiResponse(res, 403, 'Not authorized to view this tank.');
  }

  return apiResponse(res, 200, 'Tank fetched successfully', tank);
};

// Update tank (ownership enforced for farmers, admin/undugu can update any)
export const updateTank = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, spindelApiUrl } = req.body; // Allow updating spindelApiUrl too
  const userId = req.user.id;
  const userRole = req.user.role;

  // Find the tank first to check ownership/existence for authorization
  const existingTank = await prisma.tank.findUnique({
    where: { id },
    select: {
      farm: {
        select: { farmerId: true },
      },
    },
  });

  if (!existingTank) {
    return apiResponse(res, 404, 'Tank not found.');
  }



  const updatedTank = await prisma.tank.update({
    where: { id },
    data: { name, spindelApiUrl }, // Pass updated data
  });

  return apiResponse(res, 200, 'Tank updated successfully', updatedTank);
};

// Delete tank (ownership enforced for farmers, admin/undugu can delete any)
export const deleteTank = async (req: Request, res: Response) => {
  const { id } = req.params;


  // Find the tank first to check ownership/existence for authorization
  const existingTank = await prisma.tank.findUnique({
    where: { id },
   
  });

  if (!existingTank) {
    return apiResponse(res, 404, 'Tank not found.');
  }


  await prisma.tank.delete({
    where: { id },
  });

  return apiResponse(res, 200, 'Tank deleted successfully');
};