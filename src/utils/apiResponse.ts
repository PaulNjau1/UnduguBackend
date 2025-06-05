import { Response } from 'express';

export const apiResponse = (res: Response, statusCode: number, message: string, data?: any):Response => {
  return res.status(statusCode).json({
    status: statusCode,
    message,
    data,
  });
};
