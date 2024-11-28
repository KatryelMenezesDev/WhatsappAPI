import { v4 as uuidv4 } from 'uuid';
import { Client, NoAuth } from 'whatsapp-web.js';
import { Instance } from '../models/instance';
import { logger } from '../utils/logger';

class InstanceService {
  private instances: Map<string, Instance> = new Map();

  public createInstance(name: string): Instance {
    const instanceId = uuidv4();
    const client = new Client({
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      authStrategy: new NoAuth(),
    });

    const instance: Instance = { client, name, qrCode: '', auth: false };
    this.instances.set(instanceId, instance);

    client.on('qr', (qr) => {
      instance.qrCode = qr;
      logger.info(`QR RECEBIDO para a instância ${instanceId}`);
    });

    client.on('authenticated', () => {
      instance.auth = true;
      logger.info(`Instância ${instanceId} autenticada com sucesso.`);
    });

    client.on('auth_failure', () => {
      instance.auth = false;
      logger.error(`Falha na autenticação da instância ${instanceId}.`);
    });

    client.on('ready', () => {
      logger.info(`Cliente para a instância ${instanceId} está pronto!`);
    });

    client.on('disconnected', (reason) => {
      instance.auth = false;
      logger.error(`Instância ${instanceId} desconectada. Motivo: ${reason}`);
    });

    client.initialize();

    return { ...instance, id: instanceId };
  }

  public getInstance(instanceId: string): Instance | undefined {
    return this.instances.get(instanceId);
  }

  public getAllInstances(): Instance[] {
    return Array.from(this.instances.values());
  }

  public deleteInstance(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.client.destroy();
      this.instances.delete(instanceId);
      return true;
    }
    return false;
  }
}

export const instanceService = new InstanceService();
