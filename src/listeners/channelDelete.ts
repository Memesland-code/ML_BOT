import { getAuditLogExecutor } from "#discord/auditLogs.js"
import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, ChannelType, NonThreadGuildBasedChannel } from "discord.js"

export class ChannelDeleteListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(
            context, {
            event: 'channelDelete'
        })
    }

    public async run(channel: NonThreadGuildBasedChannel): Promise<void>
    {
        if (!channel.guild) return

        // Getting info
        const guild = channel.guild

        const executor = await getAuditLogExecutor(guild, AuditLogEvent.ChannelDelete, channel.id)

        const channelTypeName = ChannelType[channel.type] ?? 'Unknown'

        // Format log string
        const logString = formatEventLog({
            eventName: 'Channel deleted',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'medium',
            executor: executor ? { name: executor.username, id: executor.id } : undefined,
            details: {
                'Channel name': channel.name,
                'Channel ID': channel.id,
                'Channel type': channelTypeName,
                'Was in category': channel.parent?.name,
                'Category ID': channel.parent?.id
            }
        })

        await writeLog(logString)

        // Discord Embed log
        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        const embed = createLogEmbed({
            title: 'Channel deleted',
            color: 'Orange',
            executor,
            fields: [
                {
                    name: "Deleted channel infos",
                    value: `Channel name: ${channel.name}\nChannel ID: ${channel.id}\nChannel type: ${channelTypeName}\nIn category: ${channel.parent?.name}\nCategory ID: ${channel.parent?.id}`
                },
                {
                    name: 'Executor',
                    value: executor ? `User: <@${executor.id}>\nID: ${executor.id}` : 'Unknown'
                }
            ]
        })

        await logsChannel.send({ embeds: [embed] })
    }
}