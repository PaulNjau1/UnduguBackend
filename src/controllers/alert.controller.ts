import prisma from "../prisma/client";

import { Request, Response, NextFunction } from "express";

import {
  createAlertSchema,
  updateAlertSchema,
} from "../validators/alert.validation";
import { Role } from "@prisma/client";
import { apiResponse } from "../utils/apiResponse";

export const getAlertsByBatchId = async (req: Request, res: Response) => {
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
      return apiResponse(res, 404, "Batch not found.");
    }

  
    // Fetch alerts for the batch, ordered by creation date (descending)
    const alerts = await prisma.alert.findMany({
      where: { batchId },
      orderBy: {
        createdAt: "desc", // Most recent alerts first
      },
    });

    return apiResponse(res, 200, "Alerts retrieved successfully", alerts);
  } catch (error: any) {
    console.error("Error getting alerts by batch ID:", error);
    return apiResponse(res, 500, "Failed to retrieve alerts.", error.message);
  }
};

export const getAllAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const alerts = await prisma.alert.findMany({
      include: {
        batch: true,
        reading: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json(alerts);
  } catch (err) {
    next(err);
  }
};

export const getAlertById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const alert = await prisma.alert.findUnique({
      where: { id: req.params.id },
      include: {
        batch: true,
        reading: true,
      },
    });
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    res.status(200).json(alert);
  } catch (err) {
    next(err);
  }
};

export const createAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = createAlertSchema.parse(req.body);

    const alert = await prisma.alert.create({
      data: validated,
    });

    res.status(201).json(alert);
  } catch (err) {
    next(err);
  }
};

export const updateAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = updateAlertSchema.parse(req.body);

    const existing = await prisma.alert.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ message: "Alert not found" });

    const updated = await prisma.alert.update({
      where: { id: req.params.id },
      data: validated,
    });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deleted = await prisma.alert.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({ message: "Alert deleted", alert: deleted });
  } catch (err) {
    next(err);
  }
};
