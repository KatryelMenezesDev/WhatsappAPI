import { Request, Response, NextFunction } from 'express';
import { messageService } from '../services/messageService';

class MessageController {
  public async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { instanceId, phone, message } = req.body;
      const result = await messageService.sendMessage(instanceId, phone, message);
      res.json({
        success: true,
        message: 'Mensagem enviada com sucesso.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getMessageHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await messageService.getMessageHistory();
      res.json({
        success: true,
        message: 'Histórico de mensagens recuperado com sucesso.',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const messageController = new MessageController();
