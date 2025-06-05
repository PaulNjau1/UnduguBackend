import axios from 'axios';
import prisma from '../prisma/client';


const THINGSPEAK_URL = 'https://api.thingspeak.com/channels/2775726/feeds.json?api_key=RC7EN8GT2LYO4N4O&results=5';

// Map Thingspeak fields to your SpindelReading fields
// Adjust these keys based on the API response structure
interface ThingSpeakFeed {
  entry_id: number;      // maps to entryId
  created_at: string;    // ISO date string
  field1: string;        // angleTilt (float)
  field2: string;        // temperature (float)
  field3: string;        // unit (string)
  field4: string;        // battery (float)
  field5: string;        // gravity (float)
  field6: string;        // interval (int)
  field7: string;        // rssi (int)
  field8?: string;       // ssid (string or null)
}

async function pollThingSpeakAndSave(batchId: string) {
  try {
    const response = await axios.get(THINGSPEAK_URL);
    const feeds: ThingSpeakFeed[] = response.data.feeds;

    for (const feed of feeds) {
      // Check if reading exists (using entryId)
      const exists = await prisma.spindelReading.findUnique({
        where: { entryId: feed.entry_id },
      });

      if (!exists) {
        // Create new reading
        await prisma.spindelReading.create({
          data: {
            entryId: feed.entry_id,
            batchId,
            createdAt: new Date(feed.created_at),
            angleTilt: parseFloat(feed.field1),
            temperature: parseFloat(feed.field2),
            unit: feed.field3 || '',
            battery: parseFloat(feed.field4),
            gravity: parseFloat(feed.field5),
            interval: parseInt(feed.field6),
            rssi: parseInt(feed.field7),
            ssid: feed.field8 || null,
          },
        });
      }
    }
    console.log('ThingSpeak polling done.');
  } catch (error) {
    console.error('Error polling ThingSpeak:', error);
  }
}

// To run polling every 5 minutes:
function startPolling(batchId: string) {
  pollThingSpeakAndSave(batchId); // initial run
  setInterval(() => pollThingSpeakAndSave(batchId), 5 * 60 * 1000);
}

export { startPolling };
