import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, ChannelType, GuildBasedChannel, PermissionsBitField, TextChannel } from "discord.js"

export class ChannelUpdateListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'channelUpdate'
        })
    }

    public async run(oldChannel: GuildBasedChannel, newChannel: GuildBasedChannel): Promise<void>
    {
        const guild = newChannel.guild
        if (!guild) return


        // Fetching executor and audit logs
        const auditEvents = [
            AuditLogEvent.ChannelUpdate,
            AuditLogEvent.ChannelOverwriteUpdate,
            AuditLogEvent.ChannelOverwriteCreate,
            AuditLogEvent.ChannelOverwriteDelete
        ]

        let executor = null

        for (const eventType of auditEvents)
        {
            const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: eventType }).catch(() => null)
            const entry = auditLogs?.entries.first()

            if (entry && entry.targetId === newChannel.id && entry.createdTimestamp > Date.now() - 10000)
            {
                executor = entry.executor
                break
            }
        }

        // Detecting base properties dyanmic changes
        const changesList: string[] = []

        if (oldChannel.name !== newChannel.name)
        {
            changesList.push(`• **Name:** \`${oldChannel.name}\` ➔ \`${newChannel.name}\``)
        }

        if (oldChannel.parentId !== newChannel.parentId)
        {
            const oldCat = oldChannel.parent?.name ?? 'None'
            const newCat = newChannel.parent?.name ?? 'None'
            changesList.push(`• **Category:** \`${oldCat}\` ➔ \`${newCat}\``)
        }


        // Specific properties tied to text/voice channels
        const oldText = oldChannel as TextChannel
        const newText = newChannel as TextChannel

        if ('topic' in oldChannel && 'topic' in newChannel && oldText.topic !== newText.topic)
        {
            changesList.push(`• **Topic:** \`${oldText.topic ?? 'None'}\` ➔ \`${newText.topic ?? 'None'}\``)
        }

        if ('rateLimitPerUser' in oldChannel && 'rateLimitPerUser' in newChannel && oldText.rateLimitPerUser !== newText.rateLimitPerUser)
        {
            changesList.push(`• **Slowmode:** \`${oldText.rateLimitPerUser ?? 0}s\` ➔ \`${newText.rateLimitPerUser ?? 0}s\``)
        }

        if ('nsfw' in oldChannel && 'nsfw' in newChannel && oldText.nsfw !== newText.nsfw)
        {
            changesList.push(`• **NSFW:** \`${oldText.nsfw}\` ➔ \`${newText.nsfw}\``)
        }


        // Dynamic detection of permission overwrites
        const permChanges = this.getPermissionChanges(oldChannel, newChannel)
        if (permChanges.length > 0)
        {
            changesList.push(...permChanges)
        }


        // If no notable change detected: abort (ex. Discord's internal reorganization)
        if (changesList.length === 0) return

        const channelTypeName = ChannelType[newChannel.type] ?? 'Unknown'
        const changesText = changesList.join('\n')

        // Console log
        const logString = formatEventLog({
            eventName: 'Channel updated',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'medium',
            executor: executor ? { name: executor.username, id: executor.id } : undefined,
            details: {
                'Channel name': newChannel.name,
                'Channel ID': newChannel.id,
                'Channel type': channelTypeName,
                Changes: changesList.map((c) =>
                    c.replace(/\*\*/g, '')
                        .replace('• ', '')
                        .replace(/`/g, '"')
                        .replace('➔', '->')
                ).join(' | ')
            }
        })

        await writeLog(logString)

        // Discord log
        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        const embed = createLogEmbed({
            title: 'Channel updated',
            color: 'Yellow',
            executor,
            fields: [
                {
                    name: 'Channel infos',
                    value: `Channel: <#${newChannel.id}>\nID: ${newChannel.id}\nType: ${channelTypeName}`
                },
                {
                    name: 'Changes detected',
                    value: changesText
                },
                {
                    name: 'Executor',
                    value: executor ? `User: <@${executor.id}>\nID: ${executor.id}` : 'Unknown'
                }
            ]
        })

        await logsChannel.send({ embeds: [embed] })
    }



    // Private helper to compare permission between old and new channel
    private getPermissionChanges(oldChannel: GuildBasedChannel, newChannel: GuildBasedChannel): string[]
    {
        const changes: string[] = []

        if (!('permissionOverwrites' in oldChannel) || !('permissionOverwrites' in newChannel)) return changes

        const oldOverwrites = oldChannel.permissionOverwrites.cache
        const newOverwrites = newChannel.permissionOverwrites.cache
        const guildId = newChannel.guild.id

        const formatTarget = (id: string, type: number) =>
        {
            if (id === guildId) return '@everyone'
            return type === 0 ? `<@&${id}>` : `<@${id}>`
        }

        for (const [id, newOverwrite] of newOverwrites)
        {
            const oldOverwrite = oldOverwrites.get(id)
            const targetType = newOverwrite.type === 0 ? 'Role' : 'Member'
            const targetMention = formatTarget(id, newOverwrite.type)

            if (!oldOverwrite)
            {
                changes.push(`• **Permission added** for ${targetType} ${targetMention}`)
            }
            else
            {
                const oldAllow = new PermissionsBitField(oldOverwrite.allow)
                const newAllow = new PermissionsBitField(newOverwrite.allow)
                const oldDeny = new PermissionsBitField(oldOverwrite.deny)
                const newDeny = new PermissionsBitField((newOverwrite.deny))

                const detailedDiffs: string[] = []

                for (const [permName, bit] of Object.entries(PermissionsBitField.Flags))
                {
                    const wasAllowed = oldAllow.has(bit)
                    const isAllowed = newAllow.has(bit)
                    const wasDenied = oldDeny.has(bit)
                    const isDenied = newDeny.has(bit)

                    if (!wasAllowed && isAllowed)
                    {
                        detailedDiffs.push(`\`+${permName}\` (Granted)`)
                    }
                    else if (wasAllowed && !isAllowed)
                    {
                        detailedDiffs.push(`\`-${permName}\` (Revoked)`)
                    }

                    if (!wasDenied && isDenied)
                    {
                        detailedDiffs.push(`\`-${permName}\` (Denied)`)
                    }
                    else if (wasDenied && !isDenied)
                    {
                        detailedDiffs.push(`\`/${permName}\` (Reset/Neutral)`)
                    }
                }

                if (detailedDiffs.length > 0)
                {
                    changes.push(`• **Permissions modified** for ${targetType} ${targetMention}:\n  ├  ${detailedDiffs.join('\n  ├ ')}`)
                }
            }
        }

        for (const [id, oldOverwrite] of oldOverwrites)
        {
            if (!newOverwrites.has(id))
            {
                const targetType = oldOverwrite.type === 0 ? 'Role' : 'Member'
                const targetMention = formatTarget(id, oldOverwrite.type)
                changes.push(`• **Permission removed** for ${targetType} ${targetMention}`)
            }
        }

        return changes
    }
}