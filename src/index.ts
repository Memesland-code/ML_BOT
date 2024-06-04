import DiscordJS, { ActivityType, GatewayIntentBits, GuildMember } from "discord.js"
import WOK from 'wokcommands'
import path from 'path'
import dotenv from 'dotenv'
import fs from 'fs'
var colors = require('colors')
dotenv.config()

const client = new DiscordJS.Client({
  intents: [GatewayIntentBits.AutoModerationConfiguration, GatewayIntentBits.AutoModerationExecution, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]
})

client.on('ready', () => {
  new WOK({
    client,
    commandsDir: path.join(__dirname, "commands"),
  })

  fs.readFile('package.json', 'utf-8', function (err, data) {
    if (err) throw err
    const obj = JSON.parse(data)
    const clientVersion = obj.version
    client.user?.setActivity(`v${clientVersion} - by Memes_land`, {type: ActivityType.Custom})
  })
})

client.login(process.env.TOKEN)
console.log(colors.green(`Bot successfully connected to Discord`))