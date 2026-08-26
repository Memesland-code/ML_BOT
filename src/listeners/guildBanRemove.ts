import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, GuildBan } from "discord.js"

export class GuildBanRemoveListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'guildBanRemove'
        })
    }

    public async run(ban: GuildBan): Promise<void>
    {
        const guild = ban.guild
        if (!guild) return

        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove })

        const entry = auditLogs?.entries.first()

        const isMatch = entry && entry.targetId === ban.user.id && entry.createdTimestamp > Date.now() - 10000
        const executor = isMatch ? entry.executor : null
        const reason = isMatch && entry.reason ? entry.reason : 'No reason provided'

        // Console log
        const logString = formatEventLog({
            eventName: 'User unbanned from server',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'high',
            executor: executor ? { name: executor.username, id: executor.id } : undefined,
            details: {
                'Unbanned user': ban.user.username,
                'Unbanned user ID': ban.user.id,
                Reason: reason
            }
        })

        await writeLog(logString)


        // Discord log
        const logsChannel = await getGuildLogChannel(guild, 'high')
        if (!logsChannel) return

        const embed = createLogEmbed({
            title: 'User unbanned from server',
            color: 'DarkGreen',
            executor,
            fields: [
                {
                    name: 'User infos',
                    value: `User: <@${ban.user.id}>\nID: ${ban.user.id}`
                },
                {
                    name: 'Reason',
                    value: `\`\`\`fix\n${reason}\n\`\`\``
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