const express = require('express');
const { Client, NoAuth } = require('whatsapp-web.js');

const app = express();
const port = 3000;

app.use(express.json());

const instances = {};

app.post('/add-instance', (req, res) => {
    const { instanceId, name } = req.body;
    if (instances[instanceId]) {
        return res.status(400).send('Instance already exists');
    }

    const client = new Client({
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        authStrategy: new NoAuth(),
    });

    instances[instanceId] = { client, name, qrCode: '' };

    client.on('qr', (qr) => {
        instances[instanceId].qrCode = qr;
        console.log(`QR RECEIVED for instance ${instanceId}`, qr);
    });

    client.once('ready', () => {
        console.log(`Client for instance ${instanceId} is ready!`);
    });

    client.initialize();
    res.send(`Instance ${instanceId} is initializing...`);
});

app.get('/instances', (req, res) => {
    const instanceList = Object.keys(instances).map(id => ({
        id,
        name: instances[id].name,
    }));
    res.send(instanceList);
});

app.get('/instance/:id', (req, res) => {
    const { id } = req.params;
    const instance = instances[id];
    if (instance) {
        res.send({ id, name: instance.name, qrCode: instance.qrCode });
    } else {
        res.status(404).send('Instance not found');
    }
});

app.delete('/instance/:id', (req, res) => {
    const { id } = req.params;
    if (instances[id]) {
        instances[id].client.destroy();
        delete instances[id];
        res.send(`Instance ${id} deleted`);
    } else {
        res.status(404).send('Instance not found');
    }
});

app.post('/send-message', (req, res) => {
    const { instanceId, number, message } = req.body;
    const instance = instances[instanceId];
    if (instance) {
        instance.client.sendMessage(number, message).then(response => {
            res.send(response);
        }).catch(err => {
            res.status(500).send(err);
        });
    } else {
        res.status(404).send('Instance not found');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});