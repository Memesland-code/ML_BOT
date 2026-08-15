import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { Message, PartialMessage, TextChannel } from "discord.js"

export class MessageUpdateListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, { event: 'messageUpdate' })
    }

    public async run(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Promise<void>
    {
        if (oldMessage.partial) oldMessage = await oldMessage.fetch().catch(() => oldMessage)
        if (newMessage.partial) newMessage = await newMessage.fetch().catch(() => newMessage)

        const author = newMessage.author
        if (!author || author.bot || !newMessage.guild) return
        if (oldMessage.pinned !== newMessage.pinned) return

        const oldContentRaw = oldMessage.partial ? null : oldMessage.content
        const newContentRaw = newMessage.content

        const oldAttachmentsSize = oldMessage.attachments?.size ?? 0
        const newAttachmentsSize = newMessage.attachments?.size ?? 0

        if (oldContentRaw !== null && oldContentRaw === newContentRaw && oldAttachmentsSize === newAttachmentsSize)
        {
            return
        }

        const guild = newMessage.guild
        const channel = newMessage.channel as TextChannel

        const oldAttachments = oldMessage.attachments ? Array.from(oldMessage.attachments.values()).map(att => att.proxyURL) : []
        const newAttachments = newMessage.attachments ? Array.from(newMessage.attachments.values()).map(att => att.proxyURL) : []

        const isAttachmentStillThere = oldMessage.attachments.size !== newMessage.attachments.size
            ? (oldAttachments.length > 0 ? oldAttachments.join('\n') : 'No attachments previously')
            : 'No attachment changes'

        const isAttachment = newAttachments.length > 0
            ? newAttachments.join('\n')
            : 'No attachment'

        const formatContent = (content: string | null, isPartial: boolean) =>
        {
            if (isPartial || !content) return "Couldn't fetch previous message content: Not in cache"
            if (content.length > 1000) return `${content.slice(0, 990)}...\n[Truncated: Exceeded field limit]`
            return content
        }

        const oldContent = formatContent(oldMessage.content, oldMessage.partial)
        const newContent = formatContent(newMessage.content, newMessage.partial)

        // Console log
        const logString = formatEventLog({
            eventName: 'Message modified',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'low',
            executor: { name: author.username, id: author.id },
            details: {
                Channel: `#${channel.name} (${channel.id})`,
                'Old Content': oldMessage.content || '[Uncached / Empty]',
                'New Content': newMessage.content || '[Empty]',
                'Sent At': oldMessage.createdAt ? oldMessage.createdAt.toISOString() : 'Unknown'
            }
        })

        await writeLog(logString)

        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        // Discord log
        const embed = createLogEmbed({
            title: 'Message modified',
            color: 'Gold',
            executor: author,
            fields: [
                {
                    name: "User message infos",
                    value: `User: <@${author.id}>\nUser ID: ${author.id}\nChannel: <#${channel.id}>\nChannel ID: ${channel.id}`
                },
                {
                    name: 'Old message content',
                    value: `\`\`\`fix\n${oldContent}\n\`\`\``
                },
                {
                    name: 'New message content',
                    value: `\`\`\`fix\n${newContent}\n\`\`\``
                },
                {
                    name: 'Old message attachments if removed',
                    value: isAttachmentStillThere
                },
                {
                    name: 'Current attachments',
                    value: isAttachment
                },
                {
                    name: 'Message initially sent',
                    value: oldMessage.createdAt ? oldMessage.createdAt.toLocaleString() : 'Unknown'
                }
            ]
        })

        await logsChannel.send({ embeds: [embed] })
    }
}