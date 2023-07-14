const express = require('express');
const qrcode = require('qrcode');
const bodyParser = require('body-parser');
const { MessageMedia, LocalAuth, Client, Buttons } = require('whatsapp-web.js');
const app = express();
const PORT = process.env.PORT || 3000;

// Configure body-parser middleware to parse JSON
app.use(bodyParser.json());

const client = new Client({
  authStrategy: new LocalAuth()
});

let isClientReady = false;
let qrCodeUrl = '';

client.on('qr', async qr => {
  qrCodeUrl = await qrcode.toDataURL(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
  isClientReady = true;
  client.getChats().then(async chats => {
    const myGroup = chats.find(chat => chat.name === 'Test');
    const media = await MessageMedia.fromUrl('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png');
    client.sendMessage(myGroup.id._serialized, media, { caption: 'Bonjour, je suis un bot' });
  });
});

client.on('message', async message => {
  console.log('message from', message.from);
  if (message.body == "!button") {
    const button = new Buttons('Button body', [
      { body: 'bt1' },
      { body: 'bt2' },
      { body: 'bt3' }
    ], 'title', 'footer');
    await client.sendMessage(message.from, button);
  }
  if (message.body == 'articode') {
    message.getContact();
    message.reply('articode215');
  }
  if (message.body === 'salut') {
    message.getContact();
    message.reply('salut momo');
  }
});

client.initialize();


app.get('/', async (req, res) => {
  if (isClientReady) {
    res.sendFile(__dirname +'/index.html');
  } else {
    res.sendFile(__dirname +'/qrcodepage.html');
    //await res.send(`<img src="${qrCodeUrl}" alt="QR Code" />`);
  }
});

app.get('/sendqrcode', (req, res) => {
  const url = qrCodeUrl; // Replace with your URL
  res.status(200).json({ url });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
});

function isURL(message) {
  const urlRegex = /^(http(s)?:\/\/)?[\w.-]+\.[a-zA-Z]{2,}(\/.*)?$/;
  return urlRegex.test(message);
}


app.post('/send', async (req, res) => {
  const { number, text } = req.body;
  if (!number || !text) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  try {
    if (isURL(text)) {
      const media = await MessageMedia.fromUrl(text);
      await client.sendMessage(`${number}@c.us`, media);
      res.status(200).json({ success: 'Image sent' });
    }
    else {
      await client.sendMessage(`${number}@c.us`, text);
      console.log(`Message sent to ${number}: ${text}`);
      res.status(200).json({ success: 'Message sent'});
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});
