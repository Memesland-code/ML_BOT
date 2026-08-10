import { LogLevel, SapphireClient } from "@sapphire/framework"
import { GatewayIntentBits, Partials } from "discord.js"
import dotenv from 'dotenv'
import path from "node:path"
import { connectDatabase } from "./utils/db"
import { writeLog } from "./utils/logger"

dotenv.config()

const client = new SapphireClient(
    {
        intents: [
            GatewayIntentBits.AutoModerationConfiguration,
            GatewayIntentBits.AutoModerationExecution,
            GatewayIntentBits.DirectMessageReactions,
            GatewayIntentBits.DirectMessageTyping,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildExpressions,
            GatewayIntentBits.GuildIntegrations,
            GatewayIntentBits.GuildInvites,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildMessageTyping,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildModeration,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildScheduledEvents,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildWebhooks,
            GatewayIntentBits.Guilds,
            GatewayIntentBits.MessageContent
        ],
        partials: [
            Partials.Message,
            Partials.Channel
        ],
        loadMessageCommandListeners: true,
        logger: {
            level: LogLevel.Info
        },
        baseUserDirectory: path.join(__dirname)
    }
)

async function main(): Promise<void>
{
    try
    {
        await connectDatabase()
        writeLog('Launching client', 'INFO')
        await client.login(process.env.TOKEN)
    }
    catch (error)
    {
        writeLog(`Client failed to connect to Discord at ${new Date().toLocaleString()}\n${error}`, 'ERROR')
        process.exit(1)
    }
}

main()