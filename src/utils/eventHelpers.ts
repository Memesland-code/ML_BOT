//* --- PARSING HELPERS ---

import { ExecuteQuery } from "#db/db.js"
import { buildEventMessage } from "#discord/eventInfoBuilder.js"
import { writeLog } from "#logging/logger.js"
import { ButtonInteraction, Client, ModalSubmitInteraction, TextChannel, User } from "discord.js"

export function parseJsonArray(data: any): string[]
{ 
    if (!data) return []
    if (Array.isArray(data)) return data
    if (typeof data === 'string') try { return JSON.parse(data) } catch { return [] }
    return []
}

export function parseEventDate(rawDate: string): string | null
{ 
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
    const match = rawDate.match(dateRegex)
    if (!match) return null

    const [, day, month, year, hours, minutes] = match
    const eventDateObj = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`)
    if (isNaN(eventDateObj.getTime()) || eventDateObj < new Date()) return null

    return `${year}-${month}-${day} ${hours}:${minutes}:00`
}

export function parsePlayersCount(playersCounts: string | null): { min: number, max: number | null } | null
{
    if (!playersCounts) return { min: 0, max: null }
    
    const cleanPlayers = playersCounts.trim()
    let minPlayers = 0
    let maxPlayers: number | null = null

    if (cleanPlayers.includes('/')) {
        const parts = cleanPlayers.split('/')
        minPlayers = parseInt(parts[0].trim(), 10)
        maxPlayers = parseInt(parts[1].trim(), 10)
        if (isNaN(minPlayers) || isNaN(maxPlayers)) return null
    } else {
        minPlayers = parseInt(cleanPlayers, 10)
        if (isNaN(minPlayers)) return null
    }

    if (minPlayers < 0 || (maxPlayers !== null && maxPlayers < 1)) return null
    if (maxPlayers !== null && minPlayers > maxPlayers) return null

    return { min: minPlayers, max: maxPlayers }
}



//* --- LOGIC HELPERS ---



export async function isAuthorized(interaction: ButtonInteraction | ModalSubmitInteraction, event: any): Promise<boolean>
{
    const userId = interaction.user.id
    if (event.organizer_id === userId) return true

    const coOrgIds = parseJsonArray(event.co_organizer_ids)
    if (coOrgIds.includes(userId)) return true

    const owners = process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',').map(id => id.trim()) : []
    return owners.includes(userId)
}



export async function promoteWaitlistFIFO(eventId: number, eventTitle: string, client: Client, spotsToFill: number = 1): Promise<void> 
{
    if (spotsToFill <= 0) return

    const waitlistRows: any = await ExecuteQuery(
        `SELECT user_id FROM event_participants WHERE event_id = ? AND status = 'WAITING_LIST' ORDER BY joined_at ASC, updated_at ASC LIMIT ?`,
        [eventId, spotsToFill]
    )

    for (const row of waitlistRows) {
        const promotedUserId = row.user_id

        await ExecuteQuery(
            `UPDATE event_participants SET status = 'PRESENT', updated_at = NOW() WHERE event_id = ? AND user_id = ?`,
            [eventId, promotedUserId]
        )

        const promotedUser = await client.users.fetch(promotedUserId).catch(() => null)
        if (promotedUser) {
            await promotedUser.send(
                `🎉 **Une place s'est libérée !**\nVous avez été promu automatiquement de la liste d'attente vers les **Présents** pour l'événement **${eventTitle}** !`
            )
                .catch(() => writeLog(`Could not send promotion DM to user ${promotedUserId}`, 'WARN'))
        }
    }
}



export async function demoteWaitlistLIFO(eventId: number, maxPlayers: number, eventTitle: string, client: Client)
{ 
    //* Count current present users
    const countRows: any = await ExecuteQuery(
        `SELECT COUNT(*) AS total FROM event_participants WHERE event_id = ? AND status = 'PRESENT'`,
        [eventId]
    )

    const currentCount = countRows[0].total
    const excessCount = currentCount - maxPlayers

    //* Check if present users exceed new limit
    if (excessCount > 0)
    { 
        const excessRows: any = await ExecuteQuery(
            `SELECT user_id FROM event_participants WHERE event_id = ? AND status = 'PRESENT' ORDER BY updated_at DESC, joined_at DESC LIMIT ?`,
            [eventId, excessCount]
        )

        for (const row of excessRows)
        { 
            const demotedUserId = row.user_id

            //* Demote to WAITING_LIST
            await ExecuteQuery(
                `UPDATE event_participants SET status = 'WAITING_LIST', updated_at = NOW() WHERE event_id = ? AND user_id = ?`,
                [eventId, demotedUserId]
            )

            //* Notify demoted user
            const demotedUser = await client.users.fetch(demotedUserId).catch(() => null)
            if (demotedUser) await demotedUser.send(`⚠️ **Ajustement d'événement**\nLa capacité maximale de l'événement **${eventTitle}** a été réduite. Vous avez été placé en liste d'attente.`)
                .catch(() => writeLog(`[DemoteWaitlistLIFO] Could not send demotion DM to user ${demotedUser} (${demotedUserId})`, 'WARN'))
        }
    }
}



//* --- DISCORD EMBED REFRESHER ---



export async function updateEventMessage(eventId: number, client: Client, isNewEvent: boolean = false, editorName?: string): Promise<any>
{
    if (editorName) await ExecuteQuery(`UPDATE events SET updated_by = ? WHERE id = ?`, [editorName, eventId])

    const eventRows: any = await ExecuteQuery(`SELECT * FROM events WHERE id = ?`, [eventId])
    if (!eventRows || eventRows.length === 0) return null

    const event = eventRows[0]
    const participants: any = await ExecuteQuery(
        `SELECT user_id AS userId, status, note FROM event_participants WHERE event_id = ? ORDER BY joined_at ASC`,
        [eventId]
    )

    const organizer = await client.users.fetch(event.organizer_id).catch(() => null)
    
    const messagePayload = buildEventMessage({
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: new Date(event.event_date),
        organizerId: event.organizer_id,
        organizerName: organizer?.username ?? event.organizer_id,
        updatedBy: event.updated_by,
        coOrganizerIds: parseJsonArray(event.co_organizer_ids),
        allowedRoleIds: parseJsonArray(event.allowed_role_ids),
        minPlayers: event.min_players,
        maxPlayers: event.max_players,
        allowLatecomers: Boolean(event.allow_latecomers),
        status: event.status,
        showDebug: Boolean(event.show_debug)
    }, participants)

    // Si l'événement est déjà publié, on met à jour son message existant
    if (!isNewEvent && event.message_id && event.channel_id)
    {
        const channel = await client.channels.fetch(event.channel_id).catch(() => null) as TextChannel
        if (channel)
        {
            const originalMessage = await channel.messages.fetch(event.message_id).catch(() => null)
            if (originalMessage) await originalMessage.edit(messagePayload)
        }
    }

    return messagePayload
}



export async function sendAdminUpdateDM(targetUser: User, eventTitle: string, adminUsername: string, status: 'PRESENT' | 'UNSURE' | 'ABSENT' | 'WAITING_LIST' | 'REMOVED', note: string | null = null): Promise<void> {
    const statusLabels: Record<string, string> = {
        PRESENT: '🟢 Présent',
        UNSURE: '🟡 Pas sûr',
        ABSENT: '🔴 Absent',
        WAITING_LIST: '⌛ Liste d\'attente',
        REMOVED: '❌ Retiré de l\'événement'
    }

    let message = `🛠️ **Mise à jour d'événement**\nL'organisateur **${adminUsername}** a modifié votre participation pour l'événement **${eventTitle}** :\n- Nouveau statut : ${statusLabels[status]}`
    
    if (note && status !== 'REMOVED') {
        message += `\n• **Note :** ${note}`
    }

    await targetUser.send(message).catch(() => {
        writeLog(`[SendAdminUpdateDM] Could not send DM to user ${targetUser.id}`, 'WARN')
    })
}