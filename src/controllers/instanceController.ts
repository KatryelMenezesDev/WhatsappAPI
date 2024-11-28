import { Request, Response, NextFunction } from 'express';
import { instanceService } from '../services/instanceService';

class InstanceController {
  public addInstance(req: Request, res: Response, next: NextFunction): void {
    try {
      const { name } = req.body;
      const instance = instanceService.createInstance(name);
      res.json({
        message: 'Instância criada com sucesso',
        data: {
          id: instance.id,
          name: instance.name,
          auth: instance.auth,
          qrCode: instance.qrCode,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public listInstances(req: Request, res: Response, next: NextFunction): void {
    try {
      const instances = instanceService.getAllInstances().map(instance => ({
        id: instance.id,
        name: instance.name,
        auth: instance.auth,
        qrCode: instance.qrCode,
      }));

      res.json({
        message: 'Lista de instâncias',
        data: instances,
      });
    } catch (error) {
      next(error);
    }
  }

  public getInstanceDetails(req: Request, res: Response, next: NextFunction): void {
    try {
      const { id } = req.params;
      const instance = instanceService.getInstance(id);
      if (instance) {
        res.json({
          message: 'Detalhes da instância',
          data: {
            id: instance.id,
            name: instance.name,
            auth: instance.auth,
            qrCode: instance.qrCode,
          },
        });
      } else {
        res.status(404).json({ message: 'Instância não encontrada' });
      }
    } catch (error) {
      next(error);
    }
  }

  public deleteInstance(req: Request, res: Response, next: NextFunction): void {
    try {
      const { id } = req.params;
      const success = instanceService.deleteInstance(id);
      if (success) {
        res.json({ message: `Instância ${id} deletada com sucesso` });
      } else {
        res.status(404).json({ message: 'Instância não encontrada' });
      }
    } catch (error) {
      next(error);
    }
  }
}

export const instanceController = new InstanceController();
