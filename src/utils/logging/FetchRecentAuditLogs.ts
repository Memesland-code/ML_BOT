import { AuditLogEvent, Guild, GuildAuditLogsEntry } from "discord.js"
import { writeLog } from "./logger"

const processedAuditEntries = new Map<string, number>()

export function consumeAuditLogEntry(entryId: string): void
{
    const current = processedAuditEntries.get(entryId) ?? 0
    processedAuditEntries.set(entryId, current + 1)
}

export async function fetchRecentAuditLogs(guild: Guild, actionType: AuditLogEvent, targetId: string, targetChannelId?: string, maxAgeMs = 15_000): Promise<GuildAuditLogsEntry | null>
{
    try
    {
        const auditLogs = await guild.fetchAuditLogs({ limit: 10, type: actionType })
        const now = Date.now()

        for (const entry of auditLogs.entries.values())
        {
            if (entry.targetId && entry.targetId !== targetId) continue

            const extra = entry.extra as { count?: number; channel?: { id: string } } | undefined
            const currentCount = extra?.count ?? 1
            const consumedCount = processedAuditEntries.get(entry.id) ?? 0

            if (actionType === AuditLogEvent.MemberMove && targetChannelId && extra?.channel)
            {
                if (extra.channel.id !== targetChannelId) continue
            }

            if (actionType === AuditLogEvent.MemberUpdate && entry.changes)
            {
                const hasVoiceMod = entry.changes.some(c => c.key === 'mute' || c.key === 'deaf')
                if (!hasVoiceMod) continue
            }

            const isOldEntry = (now - entry.createdTimestamp) > maxAgeMs

            // Manage cache on cold boot for older logs
            if (consumedCount === 0 && isOldEntry)
            {
                processedAuditEntries.set(entry.id, currentCount)
            }

            if (currentCount > consumedCount)
            {
                processedAuditEntries.set(entry.id, currentCount + 1)
                return entry
            }
        }

        return null
    }
    catch (error)
    {
        writeLog(`[AuditLog Fetch Error]: error`, 'ERROR')
        return null
    }
}