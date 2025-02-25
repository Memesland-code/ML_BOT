import DiscordJS, { ActivityType, GatewayIntentBits } from "discord.js"
import WOK from 'wokcommands'
import path from 'path'
import dotenv from 'dotenv'
import fs from 'fs'
import mysql from 'mysql'
import { IsBotPerformingMaintenance } from "./functions"
var colors = require('colors')
dotenv.config()

export const client = new DiscordJS.Client({
  intents: [GatewayIntentBits.AutoModerationConfiguration, GatewayIntentBits.AutoModerationExecution, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildExpressions, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]
})

export const botAdmins = ["382055791848325122", "272492463128576000"]

client.on('ready', async() => {
  new WOK({
    client,
    commandsDir: path.join(__dirname, "commands"),
    events: {
      dir: path.join(__dirname, "events")
    },
    botOwners: botAdmins
  })

  fs.readFile('package.json', 'utf-8', function (err, data) {
    if (err) throw err
    const obj = JSON.parse(data)
    const clientVersion = obj.version
    client.user?.setActivity(`v${clientVersion} - by Memes_land`, {type: ActivityType.Custom})
  })

  if (await IsBotPerformingMaintenance()) {
    client.user?.setStatus('dnd')
  } else {
    client.user?.setStatus('online')
  }
})

export const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: "mlbot",
  password: process.env.DB_PASSWORD,
  database: "ML_Bot"
})

db.connect((err) => {
  if (err) throw err
  console.log(colors.green('Successfully connected to Mysql database'))
})

client.login(process.env.TOKEN)
console.log(colors.green(`Bot successfully connected to Discord`))