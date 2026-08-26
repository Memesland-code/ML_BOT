import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AttachmentBuilder, AuditLogEvent, Collection, GuildTextBasedChannel, Message, PartialMessage } from "discord.js"

export class MessageDeleteBulkListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'messageDeleteBulk'
        })
    }

    public async run(messages: Collection<string, Message | PartialMessage>, channel: GuildTextBasedChannel): Promise<void>
    {
        const guild = channel.guild
        if (!guild) return

        const totalCount = messages.size
        const cachedMessages = messages.filter((msg) => !msg.partial) as Collection<string, Message>
        const uncachedCount = totalCount - cachedMessages.size

        const executor = await this.fetchBulkDeleteExecutor(guild, channel)

        // Generating a text file containing the log history of cached messages
        const transcriptLines: string[] = [
            `=== BULK MESSAGE DELETE TRANSCRIPT ===`,
            `Guild: ${guild.name} (${guild.id})`,
            `Channel: #${channel.name} (${channel.id})`,
            `Total deleted: ${totalCount} (${cachedMessages.size} cached, ${uncachedCount} uncached)`,
            `Executor: ${executor ? `${executor.username} (${executor.id})` : 'Unknown'}`,
            `Date: ${new Date().toLocaleString()}`,
            `=======================================\n`
        ]

        cachedMessages.forEach((msg) =>
        {
            const authorTag = msg.author ? `${msg.author.username} (${msg.author.id})` : 'Unknown author'
            const timestamp = msg.createdAt ? msg.createdAt.toLocaleString() : 'Unknown date'
            const content = msg.content || '[No text content / attachments or embeds only]'

            transcriptLines.push(`[${timestamp}] ${authorTag}: ${content}`)

            if (msg.attachments.size > 0)
            {
                const attachmentUrls = msg.attachments.map((att) => att.url).join(', ')
                transcriptLines.push(`   ├─ Attachments: ${attachmentUrls}`)
            }
        })

        const transcriptBuffer = Buffer.from(transcriptLines.join('\n'), 'utf-8')
        const attachmentFile = new AttachmentBuilder(transcriptBuffer, {
            name: `bulk-delete-${channel.id}-${Date.now()}.txt`
        })

        // Console log
        const logString = formatEventLog({
            eventName: 'Bulk Messages Deleted',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'high',
            executor: executor ? { name: executor.username, id: executor.id } : undefined,
            details: {
                Channel: `#${channel.name} (${channel.id})`,
                'Total Messages': `${totalCount}`,
                Cached: `${cachedMessages.size}`,
                Uncached: `${uncachedCount}`
            }
        })

        await writeLog(logString)

        // Discord log
        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        const embed = createLogEmbed({
            title: 'Bulk message delete',
            color: 'Red',
            fields: [
                {
                    name: 'Overview',
                    value: [
                        `**Channel:** <#${channel.id}> (${channel.id})`,
                        `**Total messages deleted:** \`${totalCount}\``,
                        `**Cached messages:** ${cachedMessages.size}`,
                        `**Uncached messages:** ${uncachedCount}`
                    ].join('\n')
                },
                {
                    name: 'Executor',
                    value: executor
                        ? `<@${executor.id}> (${executor.id})`
                        : `'Unknown / Direct Bot API call`
                },
                {
                    name: 'Transcript',
                    value: `A full transcript of the cached deleted messages is attached to this log.`
                }
            ]
        })

        await logsChannel.send({ embeds: [embed], files: [attachmentFile] })
    }



    private async fetchBulkDeleteExecutor(guild: GuildTextBasedChannel['guild'], channel: GuildTextBasedChannel)
    {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageBulkDelete }).catch(() => null)

        const entry = auditLogs?.entries.first()
        if (!entry) return null

        const isRecent = entry.createdTimestamp > Date.now() - 5000

        const extraData = entry.extra as { channel?: { id: string } } | null
        const targetChannelId = extraData?.channel?.id

        const isSameChannel = targetChannelId === channel.id

        if (isRecent && isSameChannel && entry.executor)
        {
            return entry.executor
        }

        return null
    }
}