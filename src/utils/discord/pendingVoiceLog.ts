import { GuildAuditLogsEntry, User } from "discord.js"

export interface PendingVoiceLog
{
    guildId: string
    userId: string
    user: User
    actionType: 'move' | 'disconnect' | 'moderation' | null
    title: string
    fields: { name: string; value: string }[]
    detailsObj: Record<string, string>
    timeout: NodeJS.Timeout
}

// Key is guildID:userID
export const pendingVoiceLog = new Map<string, PendingVoiceLog>()

export const recentAuditLogs = new Map<string, GuildAuditLogsEntry>()