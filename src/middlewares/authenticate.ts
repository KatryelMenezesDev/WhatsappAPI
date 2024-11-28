import { Request, Response, NextFunction } from 'express';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token de autenticação não fornecido ou malformado.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.SECRET_KEY) {
    res.status(403).json({ message: 'Token de autenticação inválido.' });
    return;
  }

  next();
};
