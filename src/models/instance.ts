import { Client } from 'whatsapp-web.js';

export interface Instance {
  client: Client;
  name: string;
  qrCode: string;
  auth: boolean;
}
