import { pendingVoiceLog } from "#discord/pendingVoiceLog.js"
import { consumeAuditLogEntry } from "#logging/FetchRecentAuditLogs.js"
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
        const isVoiceMove = entry.action === AuditLogEvent.MemberMove
        const isVoiceDisconnect = entry.action === AuditLogEvent.MemberDisconnect

        if (!isVoiceMove && !isVoiceDisconnect) return

        const executor = entry.executor
        if (!executor) return

        const extra = entry.extra as { count?: number; channel?: { id: string } } | undefined

        for (const [key, pending] of pendingVoiceLog.entries())
        {
            if (pending.guildId !== guild.id) continue

            const matchMove = isVoiceMove && pending.actionType === 'move'
            const matchDisconnect = isVoiceDisconnect && pending.actionType === 'disconnect'

            if (matchMove || matchDisconnect)
            {
                if (matchMove && extra?.channel && pending.detailsObj['Moved to'])
                {
                    if (!pending.detailsObj['Moved to'].includes(extra.channel.id)) continue
                }

                clearTimeout(pending.timeout)
                pendingVoiceLog.delete(key)

                consumeAuditLogEntry(entry.id)

                const fullExecutor: User = executor.partial
                    ? await guild.client.users.fetch(executor.id)
                    : (executor as User)

                await flushVoiceLog(guild, pending, fullExecutor)
            }
        }
    }
}