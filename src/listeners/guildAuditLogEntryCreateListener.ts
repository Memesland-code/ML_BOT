import { pendingVoiceLog, recentAuditLogs } from "#discord/pendingVoiceLog.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, Guild, GuildAuditLogsEntry, User } from "discord.js"
import { flushVoiceLog } from "./voiceStateUpdate"

export class GuildAuditLogEntryCreateListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'guildAuditLogEntryCreate'
        })
    }

    public async run(entry: GuildAuditLogsEntry, guild: Guild): Promise<void>
    {
        this.analyseVoiceStateUpdateLog(entry, guild)
    }

    private async analyseVoiceStateUpdateLog(entry: GuildAuditLogsEntry, guild: Guild)
    { 
        const isMove = entry.action === AuditLogEvent.MemberMove
        const isDisconnect = entry.action === AuditLogEvent.MemberDisconnect
        const isUpdate = entry.action === AuditLogEvent.MemberUpdate

        let isVoiceUpdate = false
        if (isUpdate && entry.changes) {
            isVoiceUpdate = entry.changes.some(c => c.key === 'mute' || c.key === 'deaf')
        }

        // Ignore if not vocal moderation
        if (!isMove && !isDisconnect && !isVoiceUpdate) return

        const executor = entry.executor
        if (!executor) return

        //* Storing into buffer (allows to manage late-coming voiceStateUpdate)
        // Unique key to avoid overwriting logs
        const cacheKey = `${entry.id}-${Date.now()}`
        recentAuditLogs.set(cacheKey, entry)

        // Auto delete key after 3s
        setTimeout(() => recentAuditLogs.delete(cacheKey), 3000)

        //* Cross-verification with voiceStateUpdate (only for waiting logs)
        const extra = entry.extra as { channel?: { id: string } } | undefined

        for (const [key, pending] of pendingVoiceLog.entries())
        { 
            if (pending.guildId !== guild.id) continue

            // Check if the member is corresponding
            if (entry.targetId && entry.targetId !== pending.userId) continue

            const matchMove = isMove && pending.actionType === 'move'
            const matchDisconnect = isDisconnect && pending.actionType === 'disconnect'
            const matchMod = isVoiceUpdate && pending.actionType === 'moderation'

            if (matchMove || matchDisconnect || matchMod)
            { 
                if (matchMove && extra?.channel && pending.detailsObj['Moved to'])
                { 
                    if (!pending.detailsObj['Moved to'].includes(extra.channel.id)) continue
                }

                clearTimeout(pending.timeout)
                pendingVoiceLog.delete(key)

                const fullExecutor: User = executor.partial
                    ? await guild.client.users.fetch(executor.id)
                    : (executor as User)

                await flushVoiceLog(guild, pending, fullExecutor)
            }
        }
    }
}