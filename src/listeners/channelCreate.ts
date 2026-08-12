import { getAuditLogExecutor } from "#discord/auditLogs.js"
import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, ChannelType, NonThreadGuildBasedChannel } from "discord.js"

export class ChannelCreateListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'channelCreate'
        })
    }

    public async run(channel: NonThreadGuildBasedChannel): Promise<void>
    {
        if (!channel.guild) return

        const guild = channel.guild

        // Fetch executor from Audit Logs
        const executor = await getAuditLogExecutor(guild, AuditLogEvent.ChannelCreate, channel.id)

        const channelTypeName = ChannelType[channel.type] ?? 'Unknown'

        // Console log
        const logString = formatEventLog({
            eventName: 'New Channel Created',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'medium',
            executor: executor ? { name: executor.username, id: executor.id } : undefined,
            details: {
                'Channel name': channel.name,
                'Channel ID': channel.id,
                'Channel type': channelTypeName,
                'In category': channel.parent?.name,
                'Category ID': channel.parent?.id
            }
        })

        await writeLog(logString)

        // Discord log
        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        const embed = createLogEmbed({
            title: 'New channel created',
            color: 'Blue',
            executor,
            fields: [{
                name: "Channel infos",
                value: `Channel: <#${channel.id}>\nChannel ID: ${channel.id}\nChannel type: ${channelTypeName}\nIn Category: ${channel.parent?.name ?? 'None'}\nCategory ID: ${channel.parent?.id ?? 'None'}`
            },
            {
                name: 'Executor',
                value: executor ? `User: <@${executor.id}>\nID: ${executor.id}` : 'Unknown'
            }]
        })

        await logsChannel.send({ embeds: [embed] })
    }
}