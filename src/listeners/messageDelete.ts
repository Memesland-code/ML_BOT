import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, Guild, Message, PartialMessage, TextChannel } from "discord.js"

export class MessageDeleteListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'messageDelete'
        })
    }

    public async run(message: Message | PartialMessage): Promise<void>
    {
        if (!message.guild) return

        const guild = message.guild
        const channel = message.channel as TextChannel

        if (message.partial)
        {
            await this.logPartialDeletion(message, guild, channel)
            return
        }

        if (message.author?.bot) return

        const executor = await this.fetchDeleteExecutor(guild, message)

        const attachmentUrls = message.attachments.map((att) =>
            `[${att.name}](${att.proxyURL}) (${(att.size / 1024).toFixed(1)} KB)`
        )

        const attachmentFormatted = attachmentUrls.length > 0
            ? attachmentUrls.join('\n')
            : 'None'

        const rawContent = message.content.trim()
        const contentFormatted = rawContent.length > 0
            ? (rawContent.length > 10000 ? `${rawContent.slice(0, 997)}...` : rawContent)
            : 'No text content (Embed or attachment only)'

        // Console log
        const logString = formatEventLog({
            eventName: 'Message deleted',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'medium',
            executor: executor ? { name: executor.username, id: executor.id } : undefined,
            details: {
                Author: `${message.author.username} (${message.author.id})`,
                Channel: `${channel.name} (${channel.id})`,
                Content: rawContent || 'None',
                Attachments: `${message.attachments.size} attachment(s)`,
                'Sent at': message.createdAt.toISOString()
            }
        })

        await writeLog(logString)

        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        const fields = [
            {
                name: 'Message information',
                value: [
                    `**Author:** <@${message.author.id}> (${message.author.id})`,
                    `**Channel:** <#${channel.id}> (${channel.id})`,
                    `**Sent at:** <t:${Math.floor(message.createdTimestamp / 1000)}:R>`
                ].join('\n')
            },
            {
                name: 'Deleted content',
                value: `\`\`\`fix\n${contentFormatted}\n\`\`\``
            },
            {
                name: 'Attachments',
                value: attachmentFormatted
            },
            {
                name: 'Executor',
                value: executor
                    ? `<@${executor.id}> (${executor.id})`
                    : `<@${message.author.id}> (Author self-deletion)`
            }
        ]

        const embed = createLogEmbed({
            title: 'Message deleted',
            color: 'Orange',
            executor,
            fields
        })

        await logsChannel.send({ embeds: [embed] })
    }



    private async logPartialDeletion(message: PartialMessage, guild: Guild, channel: TextChannel): Promise<void>
    {
        // Console log
        const logString = formatEventLog({
            eventName: 'Uncached message deleted',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'low',
            details: {
                'Message ID': message.id,
                Channel: `${channel.name ?? 'Unknown'} (${message.channelId})`,
                Note: 'Content could not be retrieved (message was not cached)'
            }
        })

        await writeLog(logString)

        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        // Discord log
        const embed = createLogEmbed({
            title: 'Message deleted (uncached)',
            color: 'DarkGrey',
            fields: [
                {
                    name: 'Details',
                    value: [
                        `**Message ID:** ${message.id}`,
                        `**Channel:** <#${message.channelId}>`,
                        `**Note:** Message was sent prior to bot restart or fell out of cache. Content unavailable.`
                    ].join('\n')
                }
            ]
        })

        await logsChannel.send({ embeds: [embed] })
    }


    private async fetchDeleteExecutor(guild: Guild, message: Message)
    {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageDelete }).catch(() => null)

        const entry = auditLogs?.entries.first()
        if (!entry) return null

        const isRecent = entry.createdTimestamp > Date.now() - 5000
        const isSameTarget = entry.targetId === message.author.id

        if (isRecent && isSameTarget && entry.executor) return entry.executor

        return null
    }
}