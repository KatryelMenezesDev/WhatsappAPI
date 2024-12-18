import sqlite3 from 'sqlite3';
import { Message } from '../models/message';

const db = new sqlite3.Database('./message_logs.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instanceId TEXT,
      name TEXT,
      phone TEXT,
      message TEXT,
      success BOOLEAN,
      date TEXT DEFAULT (datetime('now', 'localtime'))
    )`, (err) => {
      if (err) {
        console.error('Erro ao criar tabela:', err.message);
      }
    });
  }
});

export const connectDatabase = (): void => {
  // Função para conectar ao banco de dados
};

export const logMessage = (instanceId: string, name: string, phone: string, message: string, success: boolean): void => {
  const sql = `INSERT INTO messages (instanceId, name, phone, message, success) VALUES (?, ?, ?, ?, ?)`;
  const params = [instanceId, name, phone, message, success];
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Erro ao registrar mensagem:', err.message);
      return;
    }
    console.log(`Mensagem registrada com ID: ${this.lastID}`);
  });
};

export const getAllMessages = (): Promise<Message[]> => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM messages';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as Message[]);
      }
    });
  });
};
