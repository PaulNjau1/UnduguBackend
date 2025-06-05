import { Request, Response } from "express";
import prisma from "../prisma/client";
import { apiResponse } from "../utils/apiResponse";
import axios from "axios";

const checkForAlerts = (reading: {
  angleTilt: number;
  temperature: number;
  unit: string;
  battery: number;
  gravity: number;
  interval: number;
  rssi: number;
  ssid?: string | null;
}) => {
  const alerts: string[] = [];

  // Temperature range alert (°C)
  if (reading.temperature < 15 || reading.temperature > 30) {
    alerts.push("Temperature out of range (15-30°C)");
  }

  // Gravity typical fermentation range (specific gravity)
  if (reading.gravity < 1.0 || reading.gravity > 1.2) {
    alerts.push("Gravity out of range (1.000-1.200)");
  }

  // Battery low alert (volts)
  if (reading.battery < 3.0) {
    alerts.push("Low battery voltage");
  }

  // Tilt angle abnormal (e.g., device lying flat or upside down)
  if (reading.angleTilt < 0 || reading.angleTilt > 360) {
    alerts.push("Angle tilt out of expected range (0-360°)");
  }

  // RSSI (signal strength) very low (arbitrary threshold, e.g., below -80 dBm)
  if (reading.rssi < -80) {
    alerts.push("Weak signal strength (RSSI)");
  }

  // Optionally, check for missing SSID (WiFi)
  if (!reading.ssid) {
    alerts.push("WiFi SSID not detected");
  }

  return alerts;
};

// Function to poll iSpindel API and save readings
export const pollSpindelForBatch = async (batchId: string) => {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { tank: true },
  });

  if (!batch || !batch.isActive || !batch.tank.spindelApiUrl) return;

  try {
    const url = batch.tank.spindelApiUrl;
    const { data } = await axios.get(url);

    for (const feed of data.feeds || []) {
      const entryId = parseInt(feed.entry_id);
      const exists = await prisma.spindelReading.findUnique({
        where: { entryId },
      });
      if (exists) continue;

      const newReading = await prisma.spindelReading.create({
        data: {
          entryId,
          createdAt: new Date(feed.created_at),
          angleTilt: parseFloat(feed.field1),
          temperature: parseFloat(feed.field2),
          unit: feed.field3,
          battery: parseFloat(feed.field4),
          gravity: parseFloat(feed.field5),
          interval: parseInt(feed.field6),
          rssi: parseInt(feed.field7),
          ssid: feed.field8 || null,
          batchId: batch.id,
        },
      });

      const alerts = checkForAlerts(newReading);
      if (alerts.length > 0) {
        await prisma.alert.create({
          data: {
            batchId: batch.id,
            readingId: newReading.id,
            level: "WARNING",
            message: alerts.join("; "),
          },
        });
      }
    }
  } catch (err: any) {
    console.error(`Failed to poll for batch ${batchId}:`, err.message);
  }
};

// Start fermentation
export const startFermentation = async (req: Request, res: Response) => {
  const { batchId } = req.body;

  const batch = await prisma.batch.update({
    where: { id: batchId },
    data: { isActive: true, startDate: new Date() },
  });

  // You can immediately poll once here
  await pollSpindelForBatch(batchId);

  return apiResponse(
    res,
    200,
    "Fermentation started and polling initiated",
    batch
  );
};

// End fermentation
export const stopFermentation = async (req: Request, res: Response) => {
  const { batchId } = req.body;

  const batch = await prisma.batch.update({
    where: { id: batchId },
    data: { isActive: false, endDate: new Date() },
  });

  return apiResponse(res, 200, "Fermentation stopped", batch);
};
