import colors from "colors"
import DiscordJS, { ActivityType, GatewayIntentBits, Partials } from "discord.js"
import dotenv from 'dotenv'
import fs from 'fs/promises'
import mysql from 'mysql2/promise'
import path from 'path'
import WOK from 'wokcommands'
import { HandleLog, IsBotPerformingMaintenance } from "./functions"
dotenv.config()

export const client = new DiscordJS.Client({
  intents: [GatewayIntentBits.AutoModerationConfiguration, GatewayIntentBits.AutoModerationExecution, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildExpressions, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel]
})

export const botAdmins = ["382055791848325122", "272492463128576000"]

//* Logs
async function checkAndCreateLogsFolder() {
  try {
    // Vérifie si le dossier "./logs" existe
    await fs.access("./logs").catch(async () => {
      // S'il n'existe pas, on le crée
      await fs.mkdir("./logs");
    });
  } catch (err) {
    HandleLog("Error while verifying/creating folder logs :" + err);
  }
}

const todayDate = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`

async function constructLogFileName() {
  let maxIndex = 0

  try {
    const files = await fs.readdir("./logs");

    if (files.length === 0) return `${todayDate}-0`; // Aucun fichier trouvé → on retourne "YYYY-M-D-0"

    for (const file of files) {
      const fileToCheck = file.split(".")[0]; // Supprime l'extension
      const treatedFile = fileToCheck.split("-"); // Sépare les parties du nom

      // Vérifie si le fichier correspond à la date du jour
      if (
        treatedFile[0] === new Date().getFullYear().toString() &&
        treatedFile[1] === (new Date().getMonth() + 1).toString() &&
        treatedFile[2] === new Date().getDate().toString()
      ) {
        // Récupère l'index de plus haut du jour
        const fileIndex = parseInt(treatedFile[3]);
        if (fileIndex > maxIndex) {
          maxIndex = fileIndex;
        }
      }
    }

    return `${todayDate}-${maxIndex + 1}`;
  } catch (error) {
    HandleLog("Erreur lors de la lecture des fichiers :" + error);
    throw error;
  }
}


async function createLogFile() {
  const logFile = await constructLogFileName()

  try {
    const fileHandle = await fs.open(`./logs/${logFile}.txt`, 'w')
    await fileHandle.close()

  } catch (err) {
    console.log("Error while creating log file :" + err)
    throw err
  }

  return logFile
}


// Récupère le fichier de log actif OU crée un nouveau si c'est le premier log de son jour
export async function getCurrentLogFile() {
  let maxIndex = 0

  try {
    const files = await fs.readdir("./logs")

    for (const file of files) { // Pour chaque fichier du dossier
      const fileToCheck = file.split(".")[0]; // On enlève l'extension
      const treatedFile = fileToCheck.split("-"); // On sépare par le séparateur "-"

      // Si le fichier a la date du jour
      if (
        treatedFile[0] === new Date().getFullYear().toString() &&
        treatedFile[1] === (new Date().getMonth() + 1).toString() &&
        treatedFile[2] === new Date().getDate().toString()
      ) {
        // Si l'index du fichier est plus grand que maxIndex
        const fileIndex = parseInt(treatedFile[3]);
        if (fileIndex > maxIndex) {
          maxIndex = fileIndex; // Mettre à jour l'index
        }
      }
    }

    if (maxIndex == 0) {
      return await createLogFile() // Si on a pas trouvé d'index c'est qu'il faut créer un nouveau fichier pour le jour
    } else { // Sinon on renvoie le fichier actuel
      return `${new Date().getFullYear().toString()}-${(new Date().getMonth() + 1).toString()}-${new Date().getDate().toString()}-${maxIndex}`
    }
  } catch (err) {
    HandleLog("Error while reading logs folder :" + err);
    throw err;
  }
}

export async function setClientActivity(isMaintenance: boolean) {
  try {
    const data = await fs.readFile('package.json', 'utf-8');
    const obj = JSON.parse(data);
    const clientVersion = obj.version;

    if (isMaintenance) {
        client.user?.setStatus('dnd')
        client.user?.setActivity(`⚠️ Under maintenance - v${clientVersion} - by Memes_land`, { type: ActivityType.Playing }); // ⚠️ ActivityType.Custom ne fonctionne pas toujours
    } else {
        client.user?.setStatus('online')
        client.user?.setActivity(`v${clientVersion} - by Memes_land`, { type: ActivityType.Playing }); // ⚠️ ActivityType.Custom ne fonctionne pas toujours
    }
  } catch (err) {
    HandleLog("Error while reading package.json :" + err);
  }
}

client.on('ready', async () => {
  new WOK({
    client,
    commandsDir: path.join(__dirname, 'commands'),
    events: {
      dir: path.join(__dirname, 'events')
    },
    botOwners: botAdmins
  })

  if (await IsBotPerformingMaintenance()) {
    setClientActivity(true)
  } else {
    setClientActivity(false)
  }
})



let db: mysql.Connection

export async function dbConnection() {
  if (!db) {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: "mlbot",
      password: process.env.DB_PASSWORD,
      database: "ML_Bot",
      charset: "utf8mb4",
      supportBigNumbers: true,
      bigNumberStrings: true
    })
  }

  return db
}

export { db }



checkAndCreateLogsFolder().then(async () => {
  await createLogFile().then(async () => {
    await dbConnection().then(async () => {
      await HandleLog(colors.green('Successfully connected to Mysql database')).then(async () => {
        client.login(process.env.TOKEN)
        const data = await fs.readFile('package.json', 'utf-8');
        const obj = JSON.parse(data);
        const clientVersion = obj.version;
        HandleLog(colors.green(`Bot successfully connected to Discord - running version ${clientVersion}\nConnection time: ${new Date().toLocaleString()}\n`))
      })
    })
  })
})
