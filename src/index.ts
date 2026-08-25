import { connectDatabase } from "#db/db.js"
import { writeLog } from "#logging/logger.js"
import { ApplicationCommandRegistries, LogLevel, RegisterBehavior, SapphireClient } from "@sapphire/framework"
import { GatewayIntentBits, Partials } from "discord.js"
import dotenv from 'dotenv'
import path from "node:path"

dotenv.config()

// Force overwrite on mismatch between bot's cache and Discord's cache
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite)

// Assign guilds to test servers
const guildIdsEnv = process.env.GUILD_ID

if (guildIdsEnv)
{ 
    const testGuilds = guildIdsEnv.split(',').map(id => id.trim())
    ApplicationCommandRegistries.setDefaultGuildIds(testGuilds)

    writeLog(`[SETUP] ${testGuilds.length} serveurs de test définis`, 'INFO')
}

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
        // DB connection
        await connectDatabase()

        // Discord Connection
        writeLog('Launching client...', 'INFO')
        await client.login(process.env.TOKEN)
    }
    catch (error)
    {
        writeLog(`Client failed to connect to Discord at ${new Date().toLocaleString()}\n${error}`, 'ERROR')
        process.exit(1)
    }
}

main()