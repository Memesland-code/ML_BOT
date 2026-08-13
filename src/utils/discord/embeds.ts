import { ColorResolvable, EmbedBuilder, PartialUser, User } from "discord.js"

interface LogEmbedOptions
{
    title: string
    color?: ColorResolvable
    description?: string
    executor?: User | PartialUser | null
    author?: { name: string, iconURL?: string }
    fields?: { name: string, value: string }[]
}


// Creates a clean, standardized log Embed for Discord channels
export function createLogEmbed(options: LogEmbedOptions): EmbedBuilder
{
    const embed = new EmbedBuilder()
        .setTitle(options.title)
        .setColor(options.color ?? 'Blue')
        .setFooter({ text: new Date().toLocaleString() })

    // if author is explicit
    if (options.author)
    {
        embed.setAuthor({
            name: options.author.name,
            iconURL: options.author.iconURL
        })
    }
    // if no author fallback on the executor if not null
    else if (options.executor)
    {
        embed.setAuthor({
            name: options.executor.username ?? 'Unknown User',
            iconURL: options.executor.displayAvatarURL()
        })
    }

    if (options.fields && options.fields.length > 0)
    {
        embed.addFields(options.fields)
    }

    return embed
}