import { Request, Response } from "express";
import prisma from "../prisma/client";
import { apiResponse } from "../utils/apiResponse";

function isAdminOrUndugu(user: any) {
  return user.role === "admin" || user.role === "undugu";
}

// Create a new farm
export const createFarm = async (req: Request, res: Response) => {
  const { name, location, latitude, longitude, farmerId } = req.body;
  {
    const farm = await prisma.farm.create({
      data: {
        name,
        location,
        farmerId,
        latitude,
        longitude,
      },
    });

    return apiResponse(res, 201, "Farm created", farm);
  }
};

// Get all farms (admin/undugu see all, farmers see their own)
export const getFarms = async (req: Request, res: Response) => {
  // @ts-ignore
  const user = req.user;

  const whereClause = isAdminOrUndugu(user) ? {} : { farmerId: user.id };

  const farms = await prisma.farm.findMany({ where: whereClause });

  return apiResponse(res, 200, "Farms fetched", farms);
};

// Get a specific farm by ID with role-based access
export const getFarmById = async (req: Request, res: Response) => {
  const { id } = req.params;
  // @ts-ignore
  const user = req.user;

  const farm = await prisma.farm.findUnique({
    where: { id },
  });

  if (!farm) {
    return res.status(404).json({ message: "Farm not found" });
  } 
    return apiResponse(res, 200, "Farm fetched", farm);
  
};

// Update a farm with role-based access
export const updateFarm = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, location } = req.body;
  // @ts-ignore
  const user = req.user;

  const farm = await prisma.farm.findUnique({ where: { id } });

  if (!farm) {
    return res.status(404).json({ message: "Farm not found" });
  }


  const updatedFarm = await prisma.farm.update({
    where: { id },
    data: { name, location },
  });

  return apiResponse(res, 200, "Farm updated", updatedFarm);
};

// Delete a farm with role-based access
export const deleteFarm = async (req: Request, res: Response) => {
  const { id } = req.params;
  // @ts-ignore
  const user = req.user;

  const farm = await prisma.farm.findUnique({ where: { id } });

  if (!farm) {
    return res.status(404).json({ message: "Farm not found" });
  }

  await prisma.farm.delete({ where: { id } });

  return apiResponse(res, 200, "Farm deleted");
};
