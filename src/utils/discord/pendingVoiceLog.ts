import { APIEmbedField, AuditLogEvent, Guild, GuildAuditLogsEntry, User } from "discord.js"

export interface PendingVoiceLog
{
    guildId: string
    userId: string
    user: User
    actionType: 'move' | 'disconnect' | 'moderation' | null
    title: string
    fields: APIEmbedField[]
    detailsObj: Record<string, string>
    timeout: NodeJS.Timeout
}

// Key is guildID:userID
export const pendingVoiceLog = new Map<string, PendingVoiceLog>()

export const recentAuditLogs = new Map<string, GuildAuditLogsEntry>()


const auditLastCounts = new Map<string, number>()

export async function checkIncrementedAuditLog(guild: Guild, actionType: AuditLogEvent, userId: string, targetChannelId?: string): Promise<GuildAuditLogsEntry | null>
{ 
    try {
        const auditLogs = await guild.fetchAuditLogs({ limit: 5, type: actionType })

        for (const entry of auditLogs.entries.values())
        { 
            if (entry.targetId && entry.targetId !== userId) continue

            const extra = entry.extra as { count?: number; channel?: { id: string } } | undefined
            if (actionType === AuditLogEvent.MemberMove && targetChannelId && extra?.channel) {
                if (extra.channel.id !== targetChannelId) continue
            }

            const currentCount = extra?.count ?? 1
            const lastKnownCount = auditLastCounts.get(entry.id)

            // If first time log is seen (ex: cold boot), store key and abort to avoid false positive
            if (lastKnownCount === undefined)
            { 
                auditLastCounts.set(entry.id, currentCount)
                return entry
            }

            if (currentCount > lastKnownCount)
            { 
                auditLastCounts.set(entry.id, currentCount + 1)
                return entry
            }
        }

        return null
    }
    catch (error)
    {
        return null
    }
}



export async function primeAuditLogCache(guild: Guild): Promise<void>
{
    try
    {
        const types = [AuditLogEvent.MemberMove, AuditLogEvent.MemberDisconnect, AuditLogEvent.MemberUpdate]
        for (const type of types)
        { 
            const logs = await guild.fetchAuditLogs({ limit: 10, type })
            for (const entry of logs.entries.values())
            { 
                const extra = entry.extra as { count?: number } | undefined
                auditLastCounts.set(entry.id, extra?.count ?? 1)
            }
        }
    }
    catch (e) {}
}