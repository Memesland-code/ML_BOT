import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, GuildBan } from "discord.js"

export class GuildBanAdddListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'guildBanAdd'
        })
    }

    public async run(ban: GuildBan): Promise<void>
    {
        const guild = ban.guild
        if (!guild) return

        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd }).catch(() => null)

        const entry = auditLogs?.entries.first()

        const executor = entry && entry.targetId === ban.user.id ? entry.executor : null
        const reason = entry?.reason ?? ban.reason ?? 'No reason provided'

        // Console log
        const logString = formatEventLog({
            eventName: 'User banned from server',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'high',
            executor: executor ? { name: executor.username, id: executor.id } : undefined,
            details: {
                'Banned user': ban.user.username,
                'Banned user id': ban.user.id,
                Reason: reason
            }
        })

        await writeLog(logString)

        // Discord log
        const logChannel = await getGuildLogChannel(guild, 'high')
        if (!logChannel) return

        const embed = createLogEmbed({
            title: 'User banned from server',
            color: 'DarkRed',
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

        await logChannel.send({ embeds: [embed] })
    }
}