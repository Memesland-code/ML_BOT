import { ColorResolvable, EmbedBuilder, User } from "discord.js"

interface LogEmbedOptions
{
    title: string
    executor: User | null
    fields: { name: string, value: string }[]
    color?: ColorResolvable
}


// Creates a clean, standardized log Embed for Discord channels
export function createLogEmbed(options: LogEmbedOptions): EmbedBuilder
{
    const embed = new EmbedBuilder()
        .setTitle(options.title)
        .setColor(options.color ?? 'Blue')
        .addFields(options.fields)
        .setFooter({ text: new Date().toLocaleString() })

    if (options.executor)
    {
        embed.setAuthor({
            name: options.executor.username,
            iconURL: options.executor.displayAvatarURL()
        })
    }

    return embed
}