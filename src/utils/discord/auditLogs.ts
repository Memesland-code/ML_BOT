import { AuditLogEvent, Guild, PartialUser, User } from 'discord.js'

export async function getAuditLogExecutor(
    guild: Guild,
    type: AuditLogEvent,
    targetId: string
): Promise<User | PartialUser | null>
{
    try
    {
        const auditLogs = await guild.fetchAuditLogs({ limit: 5, type })
        const entry = auditLogs.entries.find(
            (e) => e.targetId === targetId && Date.now() - e.createdTimestamp < 5000
        )
        return entry?.executor ?? null
    }
    catch (error)
    {
        return null
    }
}