import { Client } from 'whatsapp-web.js';

export interface Instance {
  id?: string;
  client: Client;
  name: string;
  qrCode: string;
  auth: boolean;
}
