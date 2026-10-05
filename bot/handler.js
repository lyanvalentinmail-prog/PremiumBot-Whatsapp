import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { api } from './lib/api.js';
import { addXp, ensureGroup, getGroup, getOrCreateUser } from './database/users.js';
import { isCommandBlocked } from './database/commands.js';
import { consumeLimit, refundLimit } from './lib/limits.js';
import { isAdmin, isGroup, isOwner } from './lib/permissions.js';
import { getMentions, getQuotedMessage, jidToNumber, requiredArgs } from './lib/utils.js';

async function filesRecursively(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesRecursively(absolute));
    else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.startsWith('_')) result.push(absolute);
  }
  return result;
}

export async function loadCommands() {
  const root = path.join(config.rootDir, 'bot', 'commands');
  const modules = await filesRecursively(root);
  const commands = [];
  for (const file of modules) {
    const imported = await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
    const exported = imported.default;
    const list = Array.isArray(exported) ? exported : [exported];
    for (const command of list) {
      if (!command || typeof command !== 'object') continue;
      if (!/^[a-z0-9_-]+$/.test(command.name || '') || typeof command.execute !== 'function') throw new Error(`Metadata de comando inválida en ${file}`);
      commands.push(command);
    }
  }
  const byName = new Map();
  for (const command of commands) {
    for (const name of [command.name, ...command.aliases]) {
      const normalized = String(name).toLowerCase();
      if (byName.has(normalized)) throw new Error(`Alias/comando duplicado: ${normalized}`);
      byName.set(normalized, command);
    }
  }
  logger.info({ commands: commands.length, files: modules.length }, 'Comandos cargados automáticamente');
  return { commands, byName };
}

function extractText(message = {}) {
  const content = message.message || {};
  const selected = content.buttonsResponseMessage?.selectedButtonId
    || content.listResponseMessage?.singleSelectReply?.selectedRowId
    || content.templateButtonReplyMessage?.selectedId;
  if (selected) return selected;
  if (content.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
    try {
      const parsed = JSON.parse(content.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
      return parsed.id || parsed.selectedId || '';
    } catch { return ''; }
  }
  return content.conversation
    || content.extendedTextMessage?.text
    || content.imageMessage?.caption
    || content.videoMessage?.caption
    || '';
}

function parseCommand(text) {
  if (!text.startsWith(config.prefix)) return null;
  const [name, ...args] = text.slice(config.prefix.length).trim().split(/\s+/);
  if (!name) return null;
  return { name: name.toLowerCase(), args };
}

function errorText(error, command, prefix) {
  const use = `${prefix}${command.name}${command.args ? ` ${command.args}` : ''}`;
  if (error.code === 'MISSING_ARGUMENT') return `❌ ${error.message || 'Falta un argumento.'}\n\nUso:\n${use}`;
  const messages = {
    OWNER_ONLY: '👑 Este comando solo está disponible para el propietario.',
    PREMIUM_ONLY: '🔒 Este comando es exclusivo para usuarios Premium.',
    ADMIN_ONLY: '🛡️ Este comando solo puede ser utilizado por administradores.',
    BOT_NOT_ADMIN: '🛡️ El bot necesita ser administrador para realizar esta acción.',
    GROUP_ONLY: '👥 Este comando solo puede usarse en grupos.',
    BANNED: '🚫 No puedes usar el bot.',
    FFMPEG_REQUIRED: `⚠️ ${error.message}`,
    ESPEAK_REQUIRED: `⚠️ ${error.message}`,
    MEDIA_REQUIRED: `⚠️ ${error.message}`,
    PROVIDER_NOT_CONFIGURED: '⚙️ Este servicio externo no está configurado por el propietario.',
    FEATURE_UNAVAILABLE: '⚠️ Esta función no está disponible porque no existe un proveedor oficial compatible configurado.',
    API_UNAVAILABLE: '⚠️ La API interna no está disponible. Inténtalo en unos segundos.',
    API_NOT_CONFIGURED: '⚠️ La API interna no está configurada. El propietario debe ejecutar npm run setup.',
    NOT_FOUND: '❌ No se encontraron resultados.',
    LIMIT_EXHAUSTED: '⚠️ Has agotado tu límite diario.',
    COMMAND_BLOCKED: '🚫 Este comando está desactivado temporalmente.',
    PRIVATE_MODE: '🔒 El bot está en modo privado.',
    INVALID_URL: '❌ La URL no es válida o apunta a un destino no permitido.',
    INVALID_EXPRESSION: `❌ ${error.message}`
  };
  return messages[error.code] || `❌ ${error.message || 'No se pudo completar el comando.'}`;
}

export function createMessageHandler({ socket, registry, startedAt, shutdown }) {
  return async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const raw of messages) {
      try {
        if (!raw.message || raw.key.fromMe || raw.key.remoteJid === 'status@broadcast') continue;
        const chat = raw.key.remoteJid;
        const sender = raw.key.participant || chat;
        if (!chat || !sender) continue;
        const text = extractText(raw).trim();
        const displayName = raw.pushName || 'Usuario';
        const user = await getOrCreateUser(sender, displayName);
        await addXp(sender, 5);
        // Antilink is checked before command parsing and never applies to group admins/owners.
        if (isGroup(chat) && /https?:\/\//i.test(text)) {
          const settings = await getGroup(chat);
          if (settings?.antilink) {
            const antiMetadata = await socket.groupMetadata(chat);
            const antiAdmins = antiMetadata.participants.filter((participant) => participant.admin).map((participant) => participant.id);
            if (!isOwner(sender) && !isAdmin(sender, antiAdmins) && isAdmin(socket.user?.id, antiAdmins)) {
              await socket.sendMessage(chat, { delete: raw.key });
              await socket.sendMessage(chat, { text: `⚠️ ${jidToNumber(sender)}, los enlaces no están permitidos en este grupo.` }, { quoted: raw });
              continue;
            }
          }
        }
        const parsed = parseCommand(text);
        if (!parsed) continue;
        const command = registry.byName.get(parsed.name);
        if (!command) continue;
        const group = isGroup(chat);
        let metadata;
        let adminJids = [];
        let botIsAdmin = false;
        if (group && (command.group || command.admin || true)) {
          metadata = await socket.groupMetadata(chat);
          adminJids = metadata.participants.filter((participant) => participant.admin).map((participant) => participant.id);
          botIsAdmin = isAdmin(socket.user?.id, adminJids);
          await ensureGroup(chat);
        }
        const context = {
          socket,
          raw,
          message: raw.message,
          quotedMessage: getQuotedMessage(raw.message),
          chat,
          sender,
          args: parsed.args,
          text,
          command,
          prefix: config.prefix,
          user,
          isGroup: group,
          isOwner: isOwner(sender),
          isAdmin: isAdmin(sender, adminJids),
          botIsAdmin,
          adminJids,
          groupMetadata: metadata,
          registry,
          startedAt,
          receivedAt: raw.messageTimestamp ? Number(raw.messageTimestamp) * 1000 : Date.now(),
          api,
          shutdown,
          reply: (content, options = {}) => socket.sendMessage(chat, typeof content === 'string' ? { text: content } : content, { quoted: raw, ...options })
        };
        if (user.banned && !context.isOwner) throw Object.assign(new Error('Banned'), { code: 'BANNED' });
        if (config.botMode === 'private' && !context.isOwner) throw Object.assign(new Error('Private'), { code: 'PRIVATE_MODE' });
        if (await isCommandBlocked(command.name)) throw Object.assign(new Error('Blocked'), { code: 'COMMAND_BLOCKED' });
        if (command.group && !group) throw Object.assign(new Error('Group'), { code: 'GROUP_ONLY' });
        if (command.owner && !context.isOwner) throw Object.assign(new Error('Owner'), { code: 'OWNER_ONLY' });
        if (command.admin && !context.isOwner && !context.isAdmin) throw Object.assign(new Error('Admin'), { code: 'ADMIN_ONLY' });
        if (command.premium && !context.isOwner && !user.isPremium) throw Object.assign(new Error('Premium'), { code: 'PREMIUM_ONLY' });
        if (parsed.args.length < requiredArgs(command.args)) throw Object.assign(new Error('Falta un argumento.'), { code: 'MISSING_ARGUMENT' });
        let consumed = false;
        if (command.limit) {
          const limit = await consumeLimit(sender);
          if (limit.exhausted) throw Object.assign(new Error('Limit'), { code: 'LIMIT_EXHAUSTED' });
          consumed = limit.consumed;
        }
        try {
          await command.execute(context);
          logger.info({ command: command.name, sender: jidToNumber(sender), group }, 'Comando ejecutado');
        } catch (error) {
          if (consumed) await refundLimit(sender).catch(() => undefined);
          throw error;
        }
      } catch (error) {
        const text = extractText(raw);
        const parsed = parseCommand(text);
        const command = parsed ? registry.byName.get(parsed.name) : null;
        logger.warn({ err: error, command: command?.name, sender: jidToNumber(raw.key.participant || raw.key.remoteJid) }, 'Error al procesar mensaje');
        if (command && raw.key.remoteJid) {
          const message = errorText(error, command, config.prefix);
          await socket.sendMessage(raw.key.remoteJid, { text: message }, { quoted: raw }).catch(() => undefined);
        }
      }
    }
  };
}

export function extractMessageText(message) { return extractText(message); }
