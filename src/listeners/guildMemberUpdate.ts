import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, Guild, GuildMember, PartialGuildMember, Role } from "discord.js"

export class GuildMemberUpdateListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'guildMemberUpdate'
        })
    }

    public async run(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember): Promise<void>
    {
        const guild = newMember.guild
        if (!guild) return

        //* -------------------------------------------------------------
        //* 1. Server nickname change
        //* -------------------------------------------------------------

        if (oldMember.nickname !== newMember.nickname)
        {
            const entry = await this.fetchAuditLog(guild, newMember.id, AuditLogEvent.MemberUpdate)
            const executor = entry?.executor ?? null
            const oldNick = oldMember.nickname ?? oldMember.user.username
            const newNick = newMember.nickname ?? newMember.user.username

            // Console log
            const logString = formatEventLog({
                eventName: 'Server nickname changed',
                guildName: guild.name,
                guildId: guild.id,
                severity: 'low',
                executor: executor ? { name: executor.username, id: executor.id } : undefined,
                details: {
                    'User username': newMember.user.username,
                    'User ID': newMember.id,
                    'Previous nickname': oldNick,
                    'New nickname': newNick
                }
            })

            await writeLog(logString)

            // Discord log
            const logsChannel = await getGuildLogChannel(guild, 'standard')
            if (logsChannel)
            {
                const embed = createLogEmbed({
                    title: 'Server nickname changed',
                    color: 'Blue',
                    author: {
                        name: newMember.user.username,
                        iconURL: newMember.user.displayAvatarURL()
                    },
                    fields: [
                        {
                            name: 'User infos',
                            value: `User: <@${newMember.id}>\nID: ${newMember.id}`
                        },
                        {
                            name: 'Previous nickname',
                            value: oldNick,
                            inline: true
                        },
                        {
                            name: 'New nickname',
                            value: newNick,
                            inline: true
                        },
                        {
                            name: 'Executor',
                            value: executor ? `User: <@${executor.id}>\nID: ${executor.id}` : 'Self (or Unknown)'
                        }
                    ]
                })

                await logsChannel.send({ embeds: [embed] })
            }
        }

        //* -------------------------------------------------------------
        //* 2. Roles change
        //* -------------------------------------------------------------

        const oldRoles = oldMember.roles.cache
        const newRoles = newMember.roles.cache

        if (oldRoles.size !== newRoles.size || !oldRoles.equals(newRoles))
        {
            const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id))
            const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id))

            if (addedRoles.size > 0 || removedRoles.size > 0)
            {
                const entry = await this.fetchAuditLog(guild, newMember.id, AuditLogEvent.MemberRoleUpdate)
                const executor = entry?.executor ?? null
                const reason = entry?.reason ?? null

                // Embed roles change field builder
                const diffLine: string[] = []
                addedRoles.forEach((role: Role) => diffLine.push(`+ ${role.name}`))
                removedRoles.forEach((role: Role) => diffLine.push(`- ${role.name}`))

                const diffFormatted = `\`\`\`diff\n${diffLine.join('\n')}\n\`\`\``

                // Console log
                const logString = formatEventLog({
                    eventName: 'Member roles updated',
                    guildName: guild.name,
                    guildId: guild.id,
                    severity: 'medium',
                    executor: executor ? { name: executor?.username, id: executor?.id } : undefined,
                    details: {
                        'User username': newMember.user.username,
                        'User ID': newMember.id,
                        ...(addedRoles.size > 0 ? { 'Added roles': addedRoles.map((r: Role) => r.name).join('\n') } : {}),
                        ...(removedRoles.size > 0 ? { 'Removed roles': removedRoles.map((r: Role) => r.name).join('\n') } : {}),
                        ...(reason ? { Reason: reason } : {})
                    }
                })

                await writeLog(logString)

                // Discord log
                const logsChannel = await getGuildLogChannel(guild, 'standard')
                if (logsChannel)
                {
                    const fields = [
                        {
                            name: 'User infos',
                            value: `User: <@${newMember.id}>\nID: ${newMember.id}`
                        },
                        {
                            name: 'Role changes',
                            value: diffFormatted
                        },
                        {
                            name: 'Executor',
                            value: executor ? `User: <@${executor.id}>\nID: ${executor.id}` : 'Unknown'
                        }
                    ]

                    if (reason)
                    {
                        fields.push({ name: 'Reason', value: `\`\`\`fix\n${reason}\n\`\`\`` })
                    }

                    const embed = createLogEmbed({
                        title: 'Member roles updated',
                        color: 'Blue',
                        author: {
                            name: newMember.user.username,
                            iconURL: newMember.user.displayAvatarURL()
                        },
                        fields
                    })

                    await logsChannel.send({ embeds: [embed] })
                }
            }
        }

        //* -------------------------------------------------------------
        //* 3. Timeout / Temporary exclusion
        //* -------------------------------------------------------------

        if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp)
        {
            const isMuted = newMember.isCommunicationDisabled()
            const entry = await this.fetchAuditLog(guild, newMember.id, AuditLogEvent.MemberUpdate)
            const executor = entry?.executor ?? null
            const reason = entry?.reason ?? null

            const eventName = isMuted ? 'Member timed out' : 'Member timeout removed'

            // Console log
            const logString = formatEventLog({
                eventName,
                guildName: guild.name,
                guildId: guild.id,
                severity: isMuted ? 'high' : 'low',
                executor: executor ? { name: executor.username, id: executor.id } : undefined,
                details: {
                    'User username': newMember.user.username,
                    'USer ID': newMember.user.id,
                    ...(isMuted && newMember.communicationDisabledUntilTimestamp
                        ? { 'Timeout until': new Date(newMember.communicationDisabledUntilTimestamp).toLocaleString() }
                        : {}),
                    ...(reason ? { Reason: reason } : {})
                }
            })

            await writeLog(logString)

            // Discord log
            const logsChannel = await getGuildLogChannel(guild, 'high')
            if (logsChannel)
            {
                const fields = [
                    {
                        name: 'User infos',
                        value: `User: <@${newMember.id}>\nID: ${newMember.id}`
                    }
                ]

                if (isMuted && newMember.communicationDisabledUntilTimestamp)
                {
                    const untilTimstamp = Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)
                    fields.push({
                        name: 'Timed out until',
                        value: `<t:${untilTimstamp}:F> (<t:${untilTimstamp}:R>)`
                    })
                }

                fields.push({
                    name: 'Executor',
                    value: executor ? `<@${executor.id}>\nID: ${executor.id}` : 'Unknown'
                })

                if (reason)
                {
                    fields.push({
                        name: 'Reason',
                        value: `\`\`\`fix\n${reason}\n\`\`\``
                    })
                }

                const embed = createLogEmbed({
                    title: eventName,
                    color: isMuted ? 'Orange' : 'Green',
                    executor: isMuted ? executor : newMember.user,
                    fields
                })

                await logsChannel.send({ embeds: [embed] })
            }
        }
    }



    // private helper to get audit logs
    private async fetchAuditLog(guild: Guild, targetId: string, type: AuditLogEvent.MemberUpdate | AuditLogEvent.MemberRoleUpdate)
    {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type }).catch(() => null)

        const entry = auditLogs?.entries.first()
        if (!entry) return null

        const isRecent = entry.createdTimestamp > Date.now() - 10000
        const isTarget = entry.targetId === targetId

        return isRecent && isTarget ? entry : null
    }
}