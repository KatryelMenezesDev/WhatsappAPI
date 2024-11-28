const express = require('express');
const { Client, NoAuth } = require('whatsapp-web.js');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

app.use(express.json());

const instances = {};

// Endpoint para adicionar uma nova instância
app.post('/add-instance', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).send('Nome é obrigatório');
    }

    const instanceId = uuidv4();

    const client = new Client({
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        authStrategy: new NoAuth(),
    });

    instances[instanceId] = { client, name, qrCode: '', auth: false };

    client.on('qr', (qr) => {
        instances[instanceId].qrCode = qr;
        console.log(`QR RECEBIDO para a instância ${instanceId}`, qr);
    });

    client.on('authenticated', () => {
        instances[instanceId].auth = true;
        console.log(`Instância ${instanceId} autenticada com sucesso.`);
    });

    client.on('auth_failure', () => {
        instances[instanceId].auth = false;
        console.log(`Falha na autenticação da instância ${instanceId}.`);
    });

    client.once('ready', () => {
        console.log(`Cliente para a instância ${instanceId} está pronto!`);
    });

    client.initialize();

    // Retorna o UUID, nome e uma mensagem indicando que o QR Code está sendo gerado
    res.send({
        id: instanceId,
        name: name,
        auth: instances[instanceId].auth,
        message: 'Instância está inicializando e o QR Code será gerado em breve.',
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
    res.send(instanceList);
});

// Endpoint para obter detalhes de uma instância específica
app.get('/instance/:id', (req, res) => {
    const { id } = req.params;
    const instance = instances[id];
    if (instance) {
        res.send({
            id,
            name: instance.name,
            qrCode: instance.qrCode,
            auth: instance.auth,
        });
    } else {
        res.status(404).send('Instância não encontrada');
    }
});

// Endpoint para deletar uma instância
app.delete('/instance/:id', (req, res) => {
    const { id } = req.params;
    if (instances[id]) {
        instances[id].client.destroy();
        delete instances[id];
        res.send(`Instância ${id} deletada`);
    } else {
        res.status(404).send('Instância não encontrada');
    }
});

// Endpoint para enviar uma mensagem
app.post('/send-message', (req, res) => {
    const { instanceId, number, message } = req.body;
    const instance = instances[instanceId];
    if (instance) {
        if (instance.auth) {
            instance.client.sendMessage(number, message).then(response => {
                res.send(response);
            }).catch(err => {
                res.status(500).send(err);
            });
        } else {
            res.status(403).send('Instância não autenticada');
        }
    } else {
        res.status(404).send('Instância não encontrada');
    }
});

app.listen(port, () => {
    console.log(`Servidor está rodando em http://localhost:${port}`);
});
