import { getLogChannelFromDB } from "#db/db.js"
import { Guild, TextChannel } from "discord.js"

export type LogChannelLevel = 'standard' | 'high'

// Retrieves the designated TextChannel for logging in a guild
export async function getGuildLogChannel(guild: Guild, level: LogChannelLevel = 'standard')
{
    const channelId = await getLogChannelFromDB(guild.id, level)
    if (!channelId) return null

    const channel = guild.channels.cache.get(channelId)
    return channel && channel.isTextBased() ? (channel as TextChannel) : null
}