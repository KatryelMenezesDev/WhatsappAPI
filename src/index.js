const express = require('express');
const morgan = require('morgan');
const { Client, NoAuth } = require('whatsapp-web.js');
const { v4: uuidv4 } = require('uuid');
const { celebrate, Joi, Segments, errors } = require('celebrate');
const sqlite3 = require('sqlite3').verbose();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

require('dotenv').config();



// Carrega o arquivo swagger.yaml
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

const app = express();
const port = 3000;

app.use(morgan('dev'));
app.use(authenticate);
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const instances = {};

// Configuração do banco de dados SQLite
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

// Função para registrar logs de mensagens no banco de dados
const logMessage = (instanceId, name, phone, message, success) => {
    const sql = `INSERT INTO messages (instanceId, name, phone, message, success) VALUES (?, ?, ?, ?, ?)`;
    const params = [instanceId, name, phone, message, success];
    db.run(sql, params, function(err) {
        if (err) {
            return console.error('Erro ao registrar mensagem:', err.message);
        }
        console.log(`Mensagem registrada com ID: ${this.lastID}`);
    });
};

// Middleware de autenticação
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido ou malformado.' });
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.SECRET_KEY) {
        return res.status(403).json({ message: 'Token de autenticação inválido.' });
    }

    next();
};


// Função para criar e inicializar uma nova instância do cliente
const createClientInstance = (instanceId, name) => {
    const client = new Client({
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        authStrategy: new NoAuth(),
    });

    instances[instanceId] = { client, name, qrCode: '', auth: false };

    client.on('qr', (qr) => {
        instances[instanceId].qrCode = qr;
        console.log(`QR RECEBIDO para a instância ${instanceId}`);
    });

    client.on('authenticated', () => {
        instances[instanceId].auth = true;
        console.log(`Instância ${instanceId} autenticada com sucesso.`);
    });

    client.on('auth_failure', () => {
        instances[instanceId].auth = false;
        console.log(`Falha na autenticação da instância ${instanceId}.`);
    });

    client.on('ready', () => {
        console.log(`Cliente para a instância ${instanceId} está pronto!`);
    });

    client.on('disconnected', (reason) => {
        instances[instanceId].auth = false;
        console.log(`Instância ${instanceId} desconectada. Motivo: ${reason}`);
    });

    client.initialize();
};

// Rota para adicionar uma nova instância
app.post('/add-instance', authenticate,  celebrate({
    [Segments.BODY]: Joi.object().keys({
        name: Joi.string().required().messages({
            'any.required': 'O campo "name" é obrigatório.',
            'string.empty': 'O campo "name" não pode estar vazio.',
        }),
    }),
}), (req, res) => {
    const { name } = req.body;
    const instanceId = uuidv4();
    createClientInstance(instanceId, name);

    res.json({
        message: 'Instância criada com sucesso',
        data: {
            id: instanceId,
            name: name,
            auth: instances[instanceId].auth,
            qrCode: instances[instanceId].qrCode,
        },
    });
});

// Rota para listar todas as instâncias
app.get('/instances', authenticate, (req, res) => {
    const instanceList = Object.keys(instances).map(id => ({
        id,
        name: instances[id].name,
        qrCode: instances[id].qrCode,
        auth: instances[id].auth,
    }));
    res.json({
        message: 'Lista de instâncias',
        data: instanceList,
    });
});

// Rota para obter detalhes de uma instância específica
app.get('/instance/:id', authenticate,  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
        id: Joi.string().uuid().required().messages({
            'any.required': 'O parâmetro "id" é obrigatório.',
            'string.guid': 'O parâmetro "id" deve ser um UUID válido.',
        }),
    }),
}), (req, res) => {
    const { id } = req.params;
    const instance = instances[id];
    if (instance) {
        res.json({
            message: 'Detalhes da instância',
            data: {
                id,
                name: instance.name,
                qrCode: instance.qrCode,
                auth: instance.auth,
            },
        });
    } else {
        res.status(404).json({ message: 'Instância não encontrada' });
    }
});

// Rota para deletar uma instância
app.delete('/instance/:id', authenticate,  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
        id: Joi.string().uuid().required().messages({
            'any.required': 'O parâmetro "id" é obrigatório.',
            'string.guid': 'O parâmetro "id" deve ser um UUID válido.',
        }),
    }),
}), (req, res) => {
    const { id } = req.params;
    if (instances[id]) {
        instances[id].client.destroy();
        delete instances[id];
        res.json({ message: `Instância ${id} deletada com sucesso` });
    } else {
        res.status(404).json({ message: 'Instância não encontrada' });
    }
});

// Rota para enviar uma mensagem
app.post('/send-message', authenticate, celebrate({
    [Segments.BODY]: Joi.object().keys({
        instanceId: Joi.string().uuid().required().messages({
            'any.required': 'O campo "instanceId" é obrigatório.',
            'string.guid': 'O campo "instanceId" deve ser um UUID válido.',
        }),
        phone: Joi.string().pattern(/^\d+$/).required().messages({
            'any.required': 'O campo "phone" é obrigatório.',
            'string.pattern.base': 'O campo "phone" deve conter apenas dígitos numéricos.',
        }),
        message: Joi.string().required().messages({
            'any.required': 'O campo "message" é obrigatório.',
            'string.empty': 'O campo "message" não pode estar vazio.',
        }),
    }),
}), async (req, res) => {
    const { instanceId, phone, message } = req.body;
    const instance = instances[instanceId];

    if (!instance) {
        return res.status(404).json({
            success: false,
            message: 'Instância não encontrada.',
        });
    }

    if (!instance.auth) {
        return res.status(403).json({
            success: false,
            message: 'Instância não autenticada. Por favor, autentique-se antes de enviar mensagens.',
        });
    }

    const chatId = `${phone}@c.us`;

    try {
        const numberDetails = await instance.client.getNumberId(phone);
        if (!numberDetails) {
            logMessage(instanceId, instance.name, phone, message, false);
            return res.status(404).json({
                success: false,
                message: 'O número fornecido não está registrado no WhatsApp.',
            });
        }

        const response = await instance.client.sendMessage(chatId, message);
        logMessage(instanceId, instance.name, phone, message, true);
        res.json({
            success: true,
            message: 'Mensagem enviada com sucesso.',
            data: {
                phone,
                message,
                response,
            },
        });
    } catch (err) {
        logMessage(instanceId, instance.name, phone, message, false);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar mensagem.',
            error: err.toString(),
        });
    }
});

// Middleware para lidar com erros de validação do celebrate
app.use(errors());

// Fechar a conexão com o banco de dados ao encerrar o aplicativo
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar o banco de dados:', err.message);
        } else {
            console.log('Conexão com o banco de dados fechada.');
        }
        process.exit(0);
    });
});

app.listen(port, () => {
    console.log(`Servidor está rodando em http://localhost:${port}`);
});
