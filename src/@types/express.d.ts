// src/types/express/index.d.ts

import { User, Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        role: Role;
      };
    }
  }
}

export {};
