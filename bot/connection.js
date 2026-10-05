import makeWASocket, { Browsers, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { createMessageHandler } from './handler.js';
import { getGroup } from './database/users.js';
import { jidToMention } from './lib/utils.js';

const MAX_RECONNECTS = 6;
export async function createConnection({ registry, startedAt, shutdown }) {
  let socket;
  let stopped = false;
  let attempts = 0;
  let timer;

  const connect = async () => {
    if (stopped) return;
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
    socket = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu(`${config.botName} Bot`),
      logger: logger.child({ component: 'baileys' }),
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false
    });
    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('messages.upsert', createMessageHandler({ socket, registry, startedAt, shutdown }));
    socket.ev.on('group-participants.update', async (event) => {
      try {
        const settings = await getGroup(event.id);
        if (!settings) return;
        const type = event.action === 'add' ? 'welcome' : event.action === 'remove' ? 'goodbye' : null;
        if (!type || !settings[type]) return;
        const template = type === 'welcome' ? settings.welcome_text : settings.goodbye_text;
        const mentions = event.participants || [];
        const text = template.replace(/@user/g, mentions.map(jidToMention).join(', '));
        await socket.sendMessage(event.id, { text, mentions });
      } catch (error) { logger.warn({ err: error }, 'No se pudo enviar mensaje de participantes'); }
    });
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        try { logger.info(`Escanea este QR si no usas pairing code:\n${await QRCode.toString(qr, { type: 'terminal', small: true })}`); } catch { logger.info('QR recibido; usa una terminal compatible para escanearlo.'); }
      }
      if (connection === 'connecting') logger.info('Conectando a WhatsApp…');
      if (connection === 'open') { attempts = 0; logger.info('WhatsApp conectado'); }
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
        if (loggedOut) { logger.error('Sesión cerrada por WhatsApp. Borra solo sessions/ para vincular de nuevo.'); return; }
        if (stopped) return;
        attempts += 1;
        if (attempts > MAX_RECONNECTS) { logger.error({ statusCode }, 'Límite de reconexiones alcanzado; reinicia el proceso después de revisar la red.'); return; }
        const delay = Math.min(30_000, 1_000 * 2 ** (attempts - 1));
        logger.warn({ statusCode, attempt: attempts, delay }, 'WhatsApp desconectado; se reintentará');
        timer = setTimeout(() => connect().catch((error) => logger.error({ err: error }, 'Error de reconexión')), delay);
      }
    });
    if (config.pairingNumber && !state.creds.registered) {
      setTimeout(async () => {
        try {
          const code = await socket.requestPairingCode(config.pairingNumber);
          logger.info({ pairingCode: code }, 'Pairing code solicitado; introdúcelo en WhatsApp > Dispositivos vinculados');
        } catch (error) { logger.warn({ err: error }, 'No se pudo solicitar pairing code; usa QR'); }
      }, 1500);
    }
  };
  await connect();
  return {
    get socket() { return socket; },
    async stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      try { socket?.end?.(new Error('Cierre solicitado')); } catch { /* socket already closed */ }
    }
  };
}
