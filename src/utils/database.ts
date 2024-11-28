import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./message_logs.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
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
      } else {
        console.log('Tabela de mensagens pronta.');
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
