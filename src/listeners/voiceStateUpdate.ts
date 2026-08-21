import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { pendingVoiceLog, PendingVoiceLog, recentAuditLogs } from "#discord/pendingVoiceLog.js"
import { fetchRecentAuditLogs } from "#logging/FetchRecentAuditLogs.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, Guild, GuildAuditLogsEntry, User, VoiceState } from "discord.js"

export async function flushVoiceLog(guild: Guild, data: Omit<PendingVoiceLog, 'timeout' | 'guildId' | 'userId'>, executor: User): Promise<void>
{
    const { title, fields, detailsObj, actionType } = data
    const isModerationAction = executor.id !== data.user.id || actionType === 'moderation'
    const severity = isModerationAction ? 'medium' : 'low'

    const logString = formatEventLog({
        eventName: title,
        guildName: guild.name,
        guildId: guild.id,
        severity,
        executor: { name: executor.username, id: executor.id },
        details: {
            User: `${data.user.username} (${data.user.id})`,
            ...detailsObj
        }
    })

    await writeLog(logString)

    const logsChannel = await getGuildLogChannel(guild, 'standard')
    if (!logsChannel) return

    const finalFields = [...fields]
    if (isModerationAction)
    {
        finalFields.push({
            name: 'Executor',
            value: `<@${executor.id}> (${executor.id})`
        })
    }

    const embed = createLogEmbed({
        title,
        color: isModerationAction ? 'Orange' : 'Blue',
        executor,
        fields: finalFields
    })

    await logsChannel.send({ embeds: [embed] })
}



export class VoiceStateUpdateListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'voiceStateUpdate'
        })
    }

    public async run(oldState: VoiceState, newState: VoiceState): Promise<void>
    {
        const guild = newState.guild
        if (!guild) return

        const member = newState.member ?? oldState.member
        if (!member || member.user.bot) return

        const user = member.user

        // Channel move detection
        const isJoin = !oldState.channelId && Boolean(newState.channelId)
        const isLeave = Boolean(oldState.channelId) && !newState.channelId
        const isMove = Boolean(oldState.channelId) && Boolean(newState.channelId) && oldState.channelId !== newState.channelId

        const stateChanges: string[] = []
        const detailsObj: Record<string, string> = {}
        let isModerationAction = false

        // Server mute check (moderator action)
        const oldServerMute = oldState.serverMute ?? false
        const newServerMute = newState.serverMute ?? false
        if (oldServerMute !== newServerMute)
        {
            stateChanges.push(`Server Mute: ${oldServerMute ? 'Yes' : 'No'} ➔ ${newServerMute ? 'Yes' : 'No'}`)
            detailsObj['Server Mute'] = `${oldServerMute} -> ${newServerMute}`
            isModerationAction = true
        }

        // Server deaf check (moderator action)
        const oldServerDeaf = oldState.serverDeaf ?? false
        const newServerDeaf = newState.serverDeaf ?? false
        if (oldServerDeaf !== newServerDeaf)
        {
            stateChanges.push(`Server Deafen: ${oldServerDeaf ? 'Yes' : 'No'} ➔ ${newServerDeaf ? 'Yes' : 'No'}`)
            detailsObj['Server Deafen'] = `${oldServerDeaf} -> ${newServerDeaf}`
            isModerationAction = true
        }

        // Self mute check
        const oldSelfMute = oldState.selfMute ?? false
        const newSelfMute = newState.selfMute ?? false
        if (oldSelfMute !== newSelfMute)
        {
            stateChanges.push(`Self Mute: ${oldSelfMute ? 'Muted' : 'Unmuted'} ➔ ${newSelfMute ? 'Muted' : 'Unmuted'}`)
            detailsObj['Self Mute'] = `${oldSelfMute} -> ${newSelfMute}`
        }

        // Self deaf check
        const oldSelfDeaf = oldState.selfDeaf ?? false
        const newSelfDeaf = newState.selfDeaf ?? false
        if (oldSelfDeaf !== newSelfDeaf)
        {
            stateChanges.push(`Self Deafen: ${oldSelfDeaf ? 'Deafened' : 'Undeafened'} ➔ ${newSelfDeaf ? 'Deafened' : 'Undeafened'}`)
            detailsObj['Self Deafen'] = `${oldSelfDeaf} -> ${newSelfDeaf}`
        }

        // Self video check
        const oldSelfVideo = oldState.selfVideo ?? false
        const newSelfVideo = newState.selfVideo ?? false
        if (oldSelfVideo !== newSelfVideo)
        {
            stateChanges.push(`Camera: ${newSelfVideo ? 'Turned On' : 'Turned Off'}`)
            detailsObj['Camera'] = `${oldSelfVideo} -> ${newSelfVideo}`
        }

        // Streaming check
        const oldStreaming = oldState.streaming ?? false
        const newStreaming = newState.streaming ?? false
        if (oldStreaming !== newStreaming)
        {
            stateChanges.push(`Stream: ${newStreaming ? 'Started Streaming' : 'Stopped Streaming'}`)
            detailsObj['Streaming'] = `${oldStreaming} -> ${newStreaming}`
        }

        // Suppress check
        const oldSuppress = oldState.suppress ?? false
        const newSuppress = newState.suppress ?? false
        if (oldSuppress !== newSuppress)
        {
            stateChanges.push(`Suppressed: ${newSuppress ? 'Muted/Suppressed' : 'Speaking Allowed'}`)
            detailsObj['Suppressed'] = `${oldSuppress} -> ${newSuppress}`
        }

        // Abort if no channel or state change detected
        if (!isJoin && !isLeave && !isMove && stateChanges.length === 0) return

        let title = 'Voice state updated'
        let actionType: 'move' | 'disconnect' | 'moderation' | null = null

        if (isJoin)
        {
            title = 'User joined voice channel'
        }
        else if (isLeave)
        {
            title = 'User left voice channel'
            actionType = 'disconnect'
        }
        else if (isMove)
        {
            title = 'User moved voice channel'
            actionType = 'move'
        }

        if (isModerationAction)
        {
            actionType = 'moderation'
        }



        //* Fields formatting
        const fields = [
            {
                name: 'User infos',
                value: `User: <@${user.id}>\nID: ${user.id}`
            }
        ]

        // Builder to include a list of present members in the channels
        const getMembersList = (members: Map<string, unknown>) =>
        {
            if (members.size === 0) return ' '
            return Array.from(members.keys()).map((id) => `<@${id}>`).join('\n')
        }


        if (isJoin && newState.channel)
        {
            const categoryName = newState.channel.parent ? `${newState.channel.parent.name} (${newState.channel.parent.id})` : '*None*'
            const membersList = getMembersList(newState.channel.members)

            fields.push(
                {
                    name: 'Channel joined',
                    value: `Channel: <#${newState.channel.id}>\nID: ${newState.channel.id}\nCategory: ${categoryName}`
                },
                {
                    name: 'Channel members',
                    value: `Connected members: \`${newState.channel.members.size}\`\n${membersList}`
                }
            )

            detailsObj['Channel joined'] = `${newState.channel.name} (${newState.channel.id})`
        }
        else if (isLeave && oldState.channel)
        {
            const categoryName = oldState.channel.parent ? `${oldState.channel.parent.name} (${oldState.channel.parent.id})` : '*None*'
            const membersList = getMembersList(oldState.channel.members)

            fields.push(
                {
                    name: 'Channel left',
                    value: `Channel: <#${oldState.channel.id}>\nID: ${oldState.channel.id}\nCategory: ${categoryName}`
                },
                {
                    name: 'Channel member',
                    value: `Connected Members: \`${oldState.channel.members.size}\`\n${membersList}`
                }
            )

            detailsObj['Channel left'] = `${oldState.channel.name} (${oldState.channel.id})`
        }
        else if (isMove && oldState.channel && newState.channel)
        {
            const oldCategoryName = oldState.channel.parent ? `${oldState.channel.parent.name} (${oldState.channel.parent.id})` : '*None*'
            const newCategoryName = newState.channel.parent ? `${newState.channel.parent.name} (${newState.channel.parent.id})` : '*None*'

            const oldMembersList = getMembersList(oldState.channel.members)
            const newMembersList = getMembersList(newState.channel.members)

            fields.push(
                {
                    name: 'Previous channel',
                    value: `<#${oldState.channel.id}> (${oldState.channel.id}\nCategory: ${oldCategoryName})`
                },
                {
                    name: 'New channel',
                    value: `<#${newState.channel.id}> (${newState.channel.id}\nCategory: ${newCategoryName})`
                },
                {
                    name: 'Previous channel members',
                    value: `Connected Members: \`${oldState.channel.members.size}\`\n${oldMembersList}`
                },
                {
                    name: 'New channel members',
                    value: `Connected Members: \`${newState.channel.members.size}\`\n${newMembersList}`
                }
            )

            detailsObj['Moved from'] = `${oldState.channel.name} (${oldState.channel.id})`
            detailsObj['Moved to'] = `${newState.channel.name} (${newState.channel.id})`
        }


        // Abort if no change
        if (stateChanges.length > 0)
        {
            fields.push({
                name: 'State changes',
                value: stateChanges.join('\n')
            })
        }



        //* If action doesn't requires audit log (join, self-action...), create logs
        if (!actionType)
        {
            await flushVoiceLog(guild, { user, title, fields, detailsObj, actionType: null }, user)
            return
        }

        //* Else create a queue using the Map with a fallback timer for later log (long match with Discord audit logs)
        const key = `${guild.id}:${user.id}`

        // Clean up potential old waiting log for same user
        if (pendingVoiceLog.has(key))
        {
            clearTimeout(pendingVoiceLog.get(key)!.timeout)
        }

        const logPayload = { user, title, fields, detailsObj, actionType }

        // Define auditLog type to search
        const auditLogType = actionType === 'move'
            ? AuditLogEvent.MemberMove
            : actionType === 'disconnect'
                ? AuditLogEvent.MemberDisconnect
                : AuditLogEvent.MemberUpdate

        const targetChannelId = newState.channelId ?? oldState.channelId ?? undefined

        let matchedEntry: GuildAuditLogsEntry | null = null

        //* Check recent memory
        for (const entry of recentAuditLogs.values())
        { 
            if (entry.action !== auditLogType) continue

            // Check for right member
            if (entry.targetId && entry.targetId !== user.id) continue

            // Check for right channel
            const extra = entry.extra as { channel?: { id: string } } | undefined
            if (auditLogType === AuditLogEvent.MemberMove && targetChannelId && extra?.channel) {
                if (extra.channel.id !== targetChannelId) continue
            }

            // Check for mute/deaf
            if (auditLogType === AuditLogEvent.MemberUpdate && entry.changes) {
                const hasVoiceMod = entry.changes.some(c => c.key === 'mute' || c.key === 'deaf')
                if (!hasVoiceMod) continue
            }

            // If everything passed, entry matched successfully
            matchedEntry = entry
            break
        }

        if (matchedEntry?.executor)
        { 
            const executor = matchedEntry.executor.partial
                ? await guild.client.users.fetch(matchedEntry.executor.id)
                : (matchedEntry.executor as User)

            await flushVoiceLog(guild, logPayload, executor)
            return
        }


        //* Put in waiting list in case log comes late
        const timeout = setTimeout(async () =>
        {
            pendingVoiceLog.delete(key)

            await flushVoiceLog(guild, logPayload, user)
        }, 3000)

        pendingVoiceLog.set(key, {
            ...logPayload,
            guildId: guild.id,
            userId: user.id,
            timeout
        })
    }
}