const path = require("path");
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { question } = require("./utils/helpers");  // Função para pegar input do usuário
const { logInfo, logError } = require("./utils/logger");  // Funções de log

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(path.resolve(__dirname, "assets", "auth"));
  const { version } = await fetchLatestBaileysVersion();
  const socket = makeWASocket({
    version,
    logger: console,
    printQRInTerminal: true,  // Mostra o QR Code no terminal
    auth: state,
  });

  socket.ev.on("creds.update", saveCreds);

  return socket;
}

connect().then(socket => {
  logInfo("Bot conectado com sucesso!");
  // Iniciar a escuta de mensagens e comandos
});
