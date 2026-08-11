import { Guild, TextChannel } from "discord.js"
import { getLogChannelFromDB } from './db'

export type LogLevel = 'standard' | 'high'

// Retrieves the designated TextChannel for logging in a guild
export async function getGuildLogChannel(guild: Guild, level: LogLevel = 'standard')
{
    const channelId = await getLogChannelFromDB(guild.id, level)
    if (!channelId) return null

    const channel = guild.channels.cache.get(channelId)
    return channel && channel.isTextBased() ? (channel as TextChannel) : null
}