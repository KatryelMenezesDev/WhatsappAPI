// src/services/messageService.ts
import { instanceService } from './instanceService';
import { logMessage,  getAllMessages} from '../utils/database';
import { Message } from '../models/message';
import { HttpException } from '../utils/HttpException';

class MessageService {
  public async sendMessage(instanceId: string, phone: string, message: string): Promise<Message> {
    const instance = instanceService.getInstance(instanceId);

    if (!instance) {
      throw new HttpException(404, 'Instância não encontrada.');
    }

    if (!instance.auth) {
      throw new HttpException(403, 'Instância não autenticada. Por favor, autentique-se antes de enviar mensagens.');
    }

    const chatId = `${phone}@c.us`;

    try {
      const numberDetails = await instance.client.getNumberId(phone);
      if (!numberDetails) {
        logMessage(instanceId, instance.name, phone, message, false);
        throw new HttpException(404, 'O número fornecido não está registrado no WhatsApp.');
      }

      const response = await instance.client.sendMessage(chatId, message);
      logMessage(instanceId, instance.name, phone, message, true);

      return {
        instanceId,
        name: instance.name,
        phone,
        message,
        success: true,
        date: new Date().toISOString(),
      };
    } catch (err) {
      logMessage(instanceId, instance.name, phone, message, false);
      throw new HttpException(500, `Erro ao enviar mensagem: ${err.message}`);
    }
  }

  public async getMessageHistory(): Promise<Message[]> {
    return await getAllMessages();
  }
}

export const messageService = new MessageService();
