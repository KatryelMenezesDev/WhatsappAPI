import app from './app';
import { connectDatabase } from './utils/database';

const PORT = process.env.PORT || 3000;

// Conectar ao banco de dados
connectDatabase();

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Documentação disponível em http://localhost:${PORT}/api-docs`);
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
