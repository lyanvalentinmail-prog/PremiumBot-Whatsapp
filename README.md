# PremiumBot WhatsApp + API REST

Un único proyecto de **Node.js 20+** que ejecuta un bot de WhatsApp con Baileys y una API REST interna con Fastify. Está diseñado para Termux/Android y Linux/VPS: la API queda ligada por defecto a `127.0.0.1`, el bot consume esa API autenticándose con la misma clave generada en el setup y los datos se guardan de forma persistente.

> No se incluyen secretos, sesiones, bases de datos reales ni temporales en Git. Las funciones que requieren un proveedor externo fallan de forma controlada cuando falta su variable de entorno.

## Características

- Baileys actual (`@whiskeysockets/baileys`), sesiones multifile, QR y Pairing Code opcional.
- Reconexión con backoff y máximo de reintentos; la sesión cerrada no entra en bucle.
- Fastify + Helmet + CORS configurable + rate limit + body limit + errores uniformes.
- API interna con `Authorization: Bearer BOT_API_KEY`; no existe ningún endpoint que revele esa clave.
- 170 comandos cargados recursivamente desde `bot/commands/`, con aliases y metadata uniforme.
- Menú dinámico, banner, navegación textual duradera (`.menu list`, `.commands`) y botón legacy cuando el cliente de WhatsApp lo admite.
- Base SQLite persistente mediante **sql.js**. Es SQLite/WASM sin módulos nativos: evita los fallos frecuentes de compilación de `sqlite3`/`better-sqlite3` en Termux y persiste en `data/bot.db` de forma atómica.
- Límites diarios transaccionales, Premium, owner, bloqueos globales, XP con cooldown anti-spam, economía, inventario y RPG.
- Panel de grupo (bienvenida, despedida, antilink, kick/promote/demote) con comprobaciones de administrador y de permisos del bot.
- Procesado de audio, imagen y stickers con FFmpeg cuando está instalado; temporales borrados al finalizar.

## Requisitos

- Node.js **20 o superior** (el proyecto también verifica esto en `npm run setup`).
- npm.
- Una cuenta de WhatsApp para vincular el bot.
- Opcional pero recomendado: FFmpeg para audio, imagen y stickers; eSpeak para `.tts` local.

## Instalación rápida en Termux

```bash
pkg update -y
pkg upgrade -y
pkg install nodejs-lts git ffmpeg espeak -y

git clone https://github.com/USUARIO/REPOSITORIO.git
cd REPOSITORIO
npm install
npm run setup
npm start
```

`npm run setup` no borra una configuración existente. Crea `.env` desde `.env.example` si hace falta, genera una `BOT_API_KEY` con `crypto.randomBytes(32)` si está vacía, crea directorios y prepara `data/bot.db`.

Para comprobar herramientas de Termux:

```bash
node scripts/termux.js
```

### Linux/VPS

```bash
git clone https://github.com/USUARIO/REPOSITORIO.git
cd REPOSITORIO
npm install
npm run setup
npm start
```

En Debian/Ubuntu, si se quieren comandos multimedia: `sudo apt install ffmpeg espeak-ng` (el binario debe estar disponible como `espeak`, o instala el paquete que lo proporcione).

## Configuración

Copia automática de referencia: `.env.example`.

| Variable | Uso |
| --- | --- |
| `BOT_NAME`, `BOT_VERSION`, `PREFIX` | Identidad y prefijo del bot. |
| `OWNER_NAME`, `OWNER_NUMBER` | Owner. `OWNER_NUMBER` lleva dígitos con prefijo de país; admite varios separados por coma. |
| `BOT_MODE` | `public` o `private`. |
| `PAIRING_NUMBER` | Número con código de país, solo dígitos, para solicitar Pairing Code. |
| `API_HOST`, `API_PORT` | API; por defecto `127.0.0.1:3000`. |
| `BOT_API_URL`, `BOT_API_KEY` | URL interna y clave compartida bot/API. La clave la genera setup. |
| `API_CORS_ORIGIN` | Vacío desactiva CORS; acepta `*` o una lista separada por comas. |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW` | Límite HTTP de la API. |
| `MAX_DAILY_LIMIT`, `PREMIUM_DAILY_LIMIT` | Límites de comandos del bot. |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | IA de texto e imagen (OpenAI API oficial). |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Alternativa para IA de texto (Gemini API oficial). |
| `WEATHER_API_KEY` | Clima (OpenWeather). |
| `REMOVE_BG_API_KEY` | Quitar fondo (remove.bg). |
| `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_ID` | Google e imágenes mediante Custom Search JSON API. |
| `YOUTUBE_API_KEY` | Búsqueda mediante YouTube Data API v3. |
| `GENIUS_ACCESS_TOKEN` | Búsqueda de canciones mediante Genius API. |

Nunca subas `.env`. Está ignorado junto a `sessions/`, `data/*.db`, `assets/temp/` y `node_modules/`.

### Rotar la API Key

```bash
npm run key:generate
# después reinicia npm start
```

La nueva clave se muestra **solo** durante setup/rotación explícita y nunca se manda por WhatsApp ni se imprime en el inicio normal.

## Vincular WhatsApp

1. Configura `OWNER_NUMBER` y opcionalmente `PAIRING_NUMBER` en `.env`.
2. Ejecuta `npm start`.
3. Con `PAIRING_NUMBER`, el terminal mostrará el código temporal. En WhatsApp abre **Dispositivos vinculados → Vincular un dispositivo → Vincular con número de teléfono**.
4. Sin `PAIRING_NUMBER`, escanea el QR que se imprime en el terminal.
5. Las credenciales quedan exclusivamente en `sessions/`.

Para volver a vincular sin perder economía, XP, configuración ni `.env`:

```bash
rm -rf sessions/*
npm start
```

## Inicio y scripts

```bash
npm start             # base, API y bot juntos
npm run dev           # igual, con watch de Node
npm run api           # solo API
npm run bot           # solo bot
npm run setup         # prepara .env, key y DB
npm run key:generate  # rota la API key
npm test              # pruebas de autenticación y carga dinámica
```

El inicio muestra el panel de sistema sin revelar la clave. Si WhatsApp no tiene red o no puede conectar, la API no se cae y Baileys reintenta con espera exponencial limitada.

## API interna

Por defecto: `http://127.0.0.1:3000`. Los endpoints `/` y `/api` son informativos. Todo `/api/v1/*`, incluido status, exige:

```http
Authorization: Bearer BOT_API_KEY
```

Respuestas correctas:

```json
{ "success": true, "creator": "Owner", "data": {} }
```

Errores de autenticación:

```json
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "API Key requerida." } }
```

- Sin clave: `401 / UNAUTHORIZED`.
- Clave incorrecta: `403 / INVALID_API_KEY`.
- Un proveedor sin configurar: `503 / PROVIDER_NOT_CONFIGURED`.

### Endpoints

| Área | Endpoints |
| --- | --- |
| Sistema | `GET /`, `GET /api`, `GET /api/v1/status` |
| AI | `POST /api/v1/ai/chat`, `/summarize`, `/rewrite`, `/grammar`, `/translate`, `/imagine` |
| Anime | `GET /api/v1/anime/search?q=`, `/info?id=`, `/character?q=`, `/waifu`, `/quote`; `GET /api/v1/manga/search?q=` |
| Search | `GET /api/v1/search/google?q=`, `/youtube?q=`, `/images?q=`, `/lyrics?q=`, `/wikipedia?q=`, `/github?q=`, `/npm?q=` |
| Tools | `POST /api/v1/tools/translate`, `GET /api/v1/tools/weather?city=`, `/whois?domain=` |
| Internet | `GET /api/v1/internet/dns?domain=`, `/ip?ip=`, `/urlcheck?url=` |
| Stalk público | `GET /api/v1/stalk/github?username=`, `/roblox?username=` |
| Quran | `GET /api/v1/quran/surah?id=`, `/ayah?surah=&ayah=`, `/search?q=` |
| Imagen | `POST /api/v1/image/remove-bg`, `/upscale` |
| Downloader | `POST /api/v1/download/youtube`, `/tiktok`, `/instagram` |

`/urlcheck` y los endpoints de downloader validan URL y bloquean localhost, loopback, redes privadas, link-local y destinos de metadata antes de actuar. No siguen redirecciones en el comprobador. Los endpoints downloader devuelven `FEATURE_UNAVAILABLE`: se deja la interfaz protegida pero **no** se implementan bypasses de DRM, paywalls, CAPTCHA, login ni controles de acceso. `upscale` también devuelve un error controlado hasta escoger un proveedor oficial compatible.

La interfaz del bot está centralizada en `bot/lib/api.js`; los plugins no repiten ni URL ni API key.

## Proveedores reales usados

- OpenAI Responses e Images API (si se configura `OPENAI_API_KEY`).
- Google Gemini `generateContent` como alternativa de texto.
- OpenWeather current weather.
- remove.bg API.
- Jikan API v4 (datos públicos de MyAnimeList), waifu.pics SFW.
- Google Custom Search JSON API y YouTube Data API v3.
- Genius API (enlaces/resultados de canciones, no scraping de letras).
- GitHub REST público, endpoints públicos de usuarios de Roblox, npm registry, Wikipedia REST, RDAP y AlQuran Cloud.
- Resolución DNS nativa de Node.js.

Cuando falte una key, el bot responde en español sin revelar la configuración ni descontar el límite si el proveedor falla.

## Menú, categorías y permisos

`.menu` envía `assets/banner.jpg` y valores dinámicos: nombre, owner, versión, modo, estado, uptime, usuario, prefijo y total real de comandos. Si el botón de WhatsApp no es compatible, usa siempre:

```text
.menu list
.menu ai
.menu tools
.commands
.help weather
```

Categorías: **◈ MAIN, ⓘ INFO, ♢ FUN, ⚒ TOOLS, ◎ INTERNET, ◉ STALK, ✿ ANIME, ♟ GAME, ⚔ RPG, ★ XP, ◇ AI, ♫ AUDIO, ⇩ DOWNLOADER, ▣ IMAGE, ✎ MAKER, ⚙ PANEL, ❝ QUOTES, ۞ QURAN, ⟳ RANDOM, ⌕ SEARCH, ♪ SOUND, ◩ STICKER, ♜ STORE, ♬ VOICE y ♛ OWNER**.

Los indicadores se generan desde metadata: `Ⓟ` Premium, `Ⓛ` limitado, `Ⓞ` owner, `Ⓐ` admin. Los comandos públicos no llevan marcador. `<argumento>` es obligatorio y `[argumento]` opcional: no debes escribir literalmente los símbolos.

### Comandos incluidos

- **Main:** `menu`, `help`, `commands`, `ping`, `status`, `profile`, `runtime`, `limit`, `mylimit`, `premium`, `premiumstatus`.
- **Info:** `info`, `botinfo`, `user`, `groupinfo`, `admins`, `ownerinfo`, `version`, `stats`.
- **Fun:** `joke`, `ship`, `rate`, `8ball`, `choose`, `reverse`.
- **Tools:** `calc`, `qr`, `translate`, `base64`, `decode64`, `hash`, `timestamp`, `weather`.
- **Internet/Stalk:** `ip`, `dns`, `whois`, `urlcheck`, `githubstalk`, `robloxstalk`.
- **Anime:** `animeinfo`, `mangainfo`, `character`, `waifu`, `animequote`.
- **Game:** `tictactoe`, `trivia`, `mathgame`, `guess`, `coinflip`, `dice`, `rps`.
- **RPG/XP:** `rpg`, `adventure`, `hunt`, `fight`, `inventory`, `equip`, `heal`, `quest`, `xp`, `level`, `rank`, `leaderboard`, `dailyxp`, `progress`, `topxp`.
- **AI:** `chat`, `ask`, `summarize`, `rewrite`, `grammar`, `explain`, `code`, `translateai`, `prompt`, `imagine`.
- **Audio/Image/Sticker/Voice:** `bass`, `nightcore`, `slow`, `speed`, `volume`, `trim`, `mp3`, `resize`, `crop`, `rotate`, `blur`, `grayscale`, `compress`, `removebg`, `upscale`, `tojpg`, `sticker`, `s`, `take`, `toimg`, `togif`, `circle`, `emojimix`, `stickerinfo`, `tts`, `robotvoice`, `deepvoice`, `chipmunk`, `slowvoice`, `fastvoice`, `reversevoice`, `voicefx`.
- **Maker/Quotes/Quran/Random:** `logo`, `banner`, `quoteimg`, `neon`, `watermark`, `quote`, `lovequote`, `motivation`, `wisdom`, `dailyquote`, `quran`, `surah`, `ayah`, `quransearch`, `randomayah`, `randomnumber`, `randomuser`, `randomcolor`, `randomfact`, `randomquote`, `randomanime`, `randomcountry`, `randomemoji`.
- **Search/Sound:** `google`, `youtube`, `wikipedia`, `github`, `npm`, `pinterest`, `lyrics`, `animesearch`, `mangasearch`, `imagesearch`, `sound`.
- **Store:** `store`, `shop`, `buy`, `sell`, `balance`, `inventory`, `daily`, `gift`, `topmoney`, `item`, `redeem`.
- **Panel/Owner:** `welcome`, `goodbye`, `setwelcome`, `setgoodbye`, `antilink`, `kick`, `promote`, `demote`, `owner`, `restart`, `shutdown`, `broadcast`, `banuser`, `unbanuser`, `addpremium`, `delpremium`, `blockcmd`, `unblockcmd`, `logs`.

El nombre repetido `.pinterest` se reserva para búsqueda de imágenes; no existe un downloader de Pinterest para evitar scraping frágil o elusión de controles.

## Datos del bot

- **Límites:** por defecto 10/día, Premium 50/día, owner ilimitado. El reset usa día UTC. El consumo y devolución ante error usan una cola transaccional SQLite.
- **Premium:** owner usa `.addpremium @usuario <dias>` y `.delpremium @usuario`. La expiración se comprueba automáticamente.
- **XP:** 5 XP por actividad con cooldown de 45 segundos; ranking persistente.
- **Economía:** saldo inicial, daily con cooldown, tienda, compra/venta/gift atómicos e inventario.
- **RPG:** salud, nivel, XP, espada/escudo, aventura/caza con cooldown, combate, pociones y misión diaria persistentes.
- **Grupos:** los comandos administrativos exigen grupo, admin que los ejecuta y bot administrador cuando la acción lo requiere.

## FFmpeg y multimedia

Para `.audio`, `.image`, `.sticker` y efectos de voz, responde a un mensaje con media. Si no hay FFmpeg, el bot responde sin caerse:

```text
⚠️ Esta función requiere FFmpeg.
```

Termux: `pkg install ffmpeg -y`. `.tts` es local y requiere además `pkg install espeak -y`. Los maker generan SVG reales como documento para no añadir renderizadores nativos incompatibles con Termux. Emoji Mix y upscale devuelven un estado claro porque no se ha seleccionado un proveedor oficial.

## Desarrollo

### Crear un comando

Crea un `.js` dentro de una carpeta de `bot/commands/` y exporta uno o varios objetos. El cargador recorre el árbol automáticamente.

```js
import { command } from '../_helpers.js';

export default [command({
  name: 'hola', aliases: [], category: 'fun', args: '[nombre]',
  description: 'Saluda.', limit: false, premium: false, owner: false, admin: false,
  execute: async (ctx) => ctx.reply(`Hola ${ctx.args[0] || ctx.user.name}`)
})];
```

### Crear una categoría

Añade la metadata visual en `bot/lib/menu.js` (`categories`), crea `bot/commands/nueva/index.js` y usa `category: 'nueva'` en los comandos. El menú y los totales se recalculan automáticamente.

### Añadir un endpoint

Crea un plugin Fastify en `api/src/routes/`, usa `success()`/`ApiError` de `api/src/utils/response.js` y regístralo con prefijo `/api/v1/...` en `api/src/app.js`. Quedará cubierto por auth, Helmet, CORS, rate limit y errores globales. Para invocarlo desde un plugin usa `ctx.api.get()` o `ctx.api.post()`.

### Cambiar el banner

Reemplaza `assets/banner.jpg` conservando un JPEG razonablemente pequeño. `.menu` lo detecta al vuelo. Cambia nombre, owner y prefijo en `.env` (`BOT_NAME`, `OWNER_NAME`, `OWNER_NUMBER`, `PREFIX`) y reinicia.

## Seguridad y operación 24/7

- No expongas `API_HOST=127.0.0.1` a Internet salvo que sepas configurar firewall, HTTPS y `API_CORS_ORIGIN`.
- No compartas `.env`, `sessions/` ni `data/bot.db`.
- La API no registra Authorization ni claves y oculta stack traces en respuestas de producción.
- Los comandos de datos públicos no hacen stalking privado ni eluden autenticación.
- Para actualizar: `git pull`, `npm install`, revisa `.env.example` y reinicia. No sustituyas `.env` sin revisar tus valores.

En Android no existe garantía real de 24/7: la optimización de batería, la suspensión, el cierre de Termux y la red pueden detenerlo. Usa `termux-wake-lock` con prudencia, desactiva optimización de batería para Termux y considera Termux:Boot/termux-services. Para producción, usa Linux/VPS y un supervisor como systemd o pm2:

```bash
npm install -g pm2
pm2 start start.js --name premiumbot
pm2 save
```

En un VPS, configura reinicio de proceso y firewall; no interpretes `.restart` como un supervisor por sí solo: el comando cierra limpiamente para que systemd/pm2 lo reinicie.

## Solución de problemas

- **`Node.js ... se requiere 20`**: actualiza Node (`pkg install nodejs-lts` en Termux).
- **No aparece QR/Pairing Code**: verifica red, elimina solo `sessions/*` y reinicia.
- **`PROVIDER_NOT_CONFIGURED`**: añade la key del proveedor correspondiente a `.env` y reinicia.
- **FFmpeg/eSpeak faltante**: instala los paquetes indicados arriba; el resto del bot sigue funcionando.
- **Puerto ocupado**: cambia `API_PORT` y también `BOT_API_URL` a la misma URL.
- **API no responde desde fuera**: es intencional con `127.0.0.1`; no cambies a `0.0.0.0` sin protección de red.
