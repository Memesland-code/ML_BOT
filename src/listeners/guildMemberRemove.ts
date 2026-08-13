import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, GuildMember, PartialGuildMember } from "discord.js"

export class GuildMemberRemoveListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'guildMemberRemove'
        })
    }

    public async run(member: GuildMember | PartialGuildMember): Promise<void>
    {
        const guild = member.guild
        if (!guild) return

        // Prevents listener from triggering for a ban
        const isBanned = await guild.bans.fetch(member.id).catch(() => null)
        if (isBanned) return

        // Account date & age calculation
        const createdAt = member.user.createdAt
        const createdTimestamp = Math.floor(createdAt.getTime() / 1000)
        const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000)
        const totalMembers = guild.memberCount

        // Check if listener is triggered from a kick
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick })

        const entry = auditLogs?.entries.first()
        const isKick = entry && entry.targetId === member.id && entry.createdTimestamp > Date.now() - 10000
        const executor = isKick ? entry.executor : null
        const kickReason = isKick && entry.reason ? entry.reason : null

        const eventName = isKick ? 'Member kicked from server' : 'Member left the server'

        // Console log
        const logString = formatEventLog({
            eventName,
            guildName: guild.name,
            guildId: guild.id,
            severity: isKick ? 'high' : 'low',
            executor: executor ? { name: executor.username, id: executor.id } : undefined,
            details: {
                'User username': member.user.username,
                'User ID': member.user.id,
                'Account age': `${accountAgeDays} days`,
                'Account creation date': createdAt.toLocaleString(),
                'Server members count': `${totalMembers}`,
                ...(kickReason ? { Reason: kickReason } : {})
            }
        })

        await writeLog(logString)


        // Discord log
        const logsChannel = await getGuildLogChannel(guild, isKick ? 'high' : 'standard')
        if (!logsChannel) return

        const fields = [
            {
                name: 'User infos',
                value: `User: <@${member.user.id}>\nID: ${member.user.id}`
            },
            {
                name: 'Account age',
                value: `${accountAgeDays} days ago (<t:${createdTimestamp}:R>)`
            },
            {
                name: 'Account creation date',
                value: `<t:${createdTimestamp}:F>`
            },
            {
                name: 'Server members count',
                value: `${totalMembers}`
            }
        ]

        if (isKick)
        {
            fields.push(
                {
                    name: 'Reason',
                    value: `\`\`\`fix\n${kickReason}\n\`\`\``
                },
                {
                    name: 'Executor',
                    value: executor ? `User: <@${executor.id}>\nID: ${executor.id}` : 'Unknown'
                }
            )
        }

        const embed = createLogEmbed({
            title: eventName,
            color: isKick ? 'Orange' : 'Red',
            executor: isKick ? executor : member.user,
            fields
        })

        await logsChannel.send({ embeds: [embed] })
    }
}