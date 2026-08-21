import { AuditLogEvent, Guild, PartialUser, User } from 'discord.js'

export async function getAuditLogExecutor(guild: Guild, type: AuditLogEvent, targetId: string): Promise<User | PartialUser | null>
{
    try
    {
        const auditLogs = await guild.fetchAuditLogs({ limit: 5, type })
        const entry = auditLogs.entries.find((e) =>
        {
            const isRecent = Date.now() - e.createdTimestamp < 5000
            if (!isRecent) return false

            if (type === AuditLogEvent.MemberMove || type === AuditLogEvent.MemberDisconnect)
            {
                if (e.targetId) return e.targetId === targetId
                return true
            }

            e.targetId === targetId
        })

        return entry?.executor ?? null
    }
    catch (error)
    {
        return null
    }
}