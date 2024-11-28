import { instanceService } from './instanceService';
import { logMessage } from '../utils/database';
import { Message } from '../models/message';

class MessageService {
  public async sendMessage(instanceId: string, phone: string, message: string): Promise<Message> {
    const instance = instanceService.getInstance(instanceId);

    if (!instance) {
      throw new Error('Instância não encontrada.');
    }

    if (!instance.auth) {
      throw new Error('Instância não autenticada. Por favor, autentique-se antes de enviar mensagens.');
    }

    const chatId = `${phone}@c.us`;

    try {
      const numberDetails = await instance.client.getNumberId(phone);
      if (!numberDetails) {
        logMessage(instanceId, instance.name, phone, message, false);
        throw new Error('O número fornecido não está registrado no WhatsApp.');
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
      throw new Error(`Erro ao enviar mensagem: ${err.message}`);
    }
  }
}

export const messageService = new MessageService();
