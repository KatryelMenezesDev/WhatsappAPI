const express = require('express');
const { Client, NoAuth } = require('whatsapp-web.js');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

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

// Endpoint para adicionar uma nova instância
app.post('/add-instance', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Nome é obrigatório' });
    }

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

// Endpoint para listar todas as instâncias com seus QR Codes e status de autenticação
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

// Endpoint para obter detalhes de uma instância específica
app.get('/instance/:id', (req, res) => {
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

// Endpoint para deletar uma instância
app.delete('/instance/:id', (req, res) => {
    const { id } = req.params;
    if (instances[id]) {
        instances[id].client.destroy();
        delete instances[id];
        res.json({ message: `Instância ${id} deletada com sucesso` });
    } else {
        res.status(404).json({ message: 'Instância não encontrada' });
    }
});

// Endpoint para enviar uma mensagem
app.post('/send-message', (req, res) => {
    const { instanceId, phone, message } = req.body;

    // Verifica se todos os parâmetros necessários foram fornecidos
    if (!instanceId || !phone || !message) {
        return res.status(400).json({
            success: false,
            message: 'Parâmetros ausentes: instanceId, phone e message são obrigatórios.',
        });
    }

    const instance = instances[instanceId];

    // Verifica se a instância existe
    if (!instance) {
        return res.status(404).json({
            success: false,
            message: 'Instância não encontrada.',
        });
    }

    // Verifica se a instância está autenticada
    if (!instance.auth) {
        return res.status(403).json({
            success: false,
            message: 'Instância não autenticada. Por favor, autentique-se antes de enviar mensagens.',
        });
    }

    // Tenta enviar a mensagem
    instance.client.sendMessage(phone, message)
        .then(response => {
            res.json({
                success: true,
                message: 'Mensagem enviada com sucesso.',
                data: {
                    phone,
                    message,
                    response,
                },
            });
        })
        .catch(err => {
            res.status(500).json({
                success: false,
                message: 'Erro ao enviar mensagem.',
                error: err.toString(),
            });
        });
});

app.listen(port, () => {
    console.log(`Servidor está rodando em http://localhost:${port}`);
});
