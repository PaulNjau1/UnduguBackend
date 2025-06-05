import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const signToken = (payload: object, expiresIn: string = env.JWT_EXPIRES_IN) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn });

export const verifyToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET);
