const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');

// Koyeb-ൽ നിന്ന് നിങ്ങളുടെ വാട്സപ്പ് നമ്പർ എടുക്കാൻ
const phoneNumber = process.env.BOT_NUMBER; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // QR കോഡ് വേണ്ട, പകരം Pairing Code മതി
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // ബോട്ട് കണക്ട് ആയിട്ടില്ലെങ്കിൽ Pairing Code ഉണ്ടാക്കാൻ
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            console.log(`\nനിങ്ങളുടെ PAIRING CODE ഇതാണ്: ${code}\n`);
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    // മെസ്സേജ് വരുമ്പോൾ പ്രവർത്തിക്കാൻ
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        // ആരെങ്കിലും Hi അയച്ചാൽ മറുപടി
        if (text === 'Hi') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'ഹലോ! ഞാൻ കോയബിൽ റൺ ചെയ്യുന്ന നിങ്ങളുടെ സ്വന്തം ബോട്ട് ആണ്.' });
        }
    });
}

startBot();
