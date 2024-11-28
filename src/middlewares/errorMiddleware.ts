import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../utils/HttpException';

export const errorMiddleware = (
  err: HttpException,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';
  res.status(status).json({
    success: false,
    message,
  });
};
