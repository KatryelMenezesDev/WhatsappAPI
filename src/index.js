const express = require('express');
const morgan = require('morgan');
const { Client, NoAuth } = require('whatsapp-web.js');
const { v4: uuidv4 } = require('uuid');
const { celebrate, Joi, Segments, errors } = require('celebrate');

const app = express();
const port = 3000;

app.use(morgan('dev'));
app.use(express.json());

const instances = {};

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
app.post('/add-instance', celebrate({
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
app.get('/instances', (req, res) => {
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
app.get('/instance/:id', celebrate({
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
app.delete('/instance/:id', celebrate({
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
app.post('/send-message', celebrate({
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
            return res.status(404).json({
                success: false,
                message: 'O número fornecido não está registrado no WhatsApp.',
            });
        }

        const response = await instance.client.sendMessage(chatId, message);
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
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar mensagem.',
            error: err.toString(),
        });
    }
});

// Middleware para lidar com erros de validação do celebrate
app.use(errors());

app.listen(port, () => {
    console.log(`Servidor está rodando em http://localhost:${port}`);
});
