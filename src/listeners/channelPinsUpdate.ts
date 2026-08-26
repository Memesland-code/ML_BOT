import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, ChannelType, GuildTextBasedChannel, TextBasedChannel } from "discord.js"

export class ChannelPinsUpdateListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'channelPinsUpdate'
        })
    }

    public async run(channel: TextBasedChannel): Promise<void>
    {
        // Restrict checks to guild text channels
        if (channel.type !== ChannelType.GuildText) return
        const textChannel = channel as GuildTextBasedChannel
        const guild = textChannel.guild

        // Fetching the 2 types of audit logs
        const [pinLogs, unpinLogs] = await Promise.all([
            guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessagePin }).catch(() => null),
            guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageUnpin }).catch(() => null)
        ])

        const pinEntry = pinLogs?.entries.first()
        const unpinEntry = unpinLogs?.entries.first()

        // Filter to check if audit points towards the right channel
        const validPin = pinEntry?.extra?.channel?.id === channel.id ? pinEntry : null
        const validUnpin = unpinEntry?.extra?.channel?.id === channel.id ? unpinEntry : null

        // Determine most recent entry
        let selectedEntry = null
        let isPinned = false

        if (validPin && validUnpin)
        {
            if (validPin.createdTimestamp > validUnpin.createdTimestamp)
            {
                selectedEntry = validPin
                isPinned = true
            }
            else
            {
                selectedEntry = validUnpin
                isPinned = false
            }
        }
        else if (validPin)
        {
            selectedEntry = validPin
            isPinned = true
        }
        else if (validUnpin)
        {
            selectedEntry = validUnpin
            isPinned = false
        }

        // If no recent entry found, stop execution here
        if (!selectedEntry) return


        const executor = selectedEntry.executor
        const actionText = isPinned ? 'New message pinned' : 'Message pin removed'
        const messageId = (selectedEntry.extra as { messageId?: string })?.messageId
        const messageUrl = messageId ? `https://discord.com/channels/${guild.id}/${channel.id}/${messageId}` : null

        // Console log
        const logDetails: Record<string, string | undefined> = {
            'In channel': textChannel.name,
            'Channel ID': textChannel.id,
            'In category': textChannel.parent?.name ?? 'None',
            'Category ID': textChannel.parent?.id ?? 'None'
        }

        if (messageUrl)
        {
            logDetails['Message ref'] = messageUrl
        }

        const logString = formatEventLog({
            eventName: actionText,
            guildName: guild.name,
            guildId: guild.id,
            severity: 'low',
            executor: executor ? { name: executor.username, id: executor.id } : undefined,
            details: logDetails
        })

        await writeLog(logString)

        // Discord log
        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        const fields = [
            {
                name: 'Channel infos',
                value: `Channel: <#${channel.id}>\nID: ${channel.id}\nCategory: ${textChannel.parent?.name ?? 'None'}\nCategory ID: ${textChannel.parent?.id ?? 'None'}\n`
            }
        ]

        if (messageUrl)
        {
            fields.push({
                name: 'Message ref',
                value: `[Message link](${messageUrl})`
            })
        }

        fields.push({
            name: 'Executor',
            value: executor ? `User: <@${executor.id}>\nID: ${executor.id}` : 'Unknown'
        })

        const embed = createLogEmbed({
            title: actionText,
            color: isPinned ? 'DarkAqua' : 'Orange',
            executor,
            fields
        })

        await logsChannel.send({ embeds: [embed] })
    }
}