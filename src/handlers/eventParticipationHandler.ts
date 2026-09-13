import { ExecuteQuery } from "#db/db.js"
import { buildEventMessage } from "#discord/eventInfoBuilder.js"
import { writeLog } from "#logging/logger.js"
import { ButtonInteraction, LabelBuilder, MessageFlags, ModalBuilder, ModalSubmitInteraction, TextChannel, TextInputStyle } from "discord.js"

type ParticipationStatus = 'PRESENT' | 'UNSURE' | 'ABSENT'

/**
 *? Step 1: Triggered when user click Present, Unsure or Absent button.
 *? Opens a modal with their existing note pre-filled if present
 */
export async function handleParticipationButtonClick(interaction: ButtonInteraction, status: ParticipationStatus)
{ 
    const eventId = interaction.customId.split(":")[2]
    const userId = interaction.user.id

    try 
    {
        //* Fetch event details to check status and allowed roles before submitting Modal
        const eventRows: any = await ExecuteQuery(`SELECT status, allowed_role_ids FROM events WHERE id = ?`, [eventId])

        if (!eventRows || eventRows.length === 0) return interaction.reply({ content: "❌ **Événement introuvable.** Il a peut-être été supprimé.", flags: MessageFlags.Ephemeral })

        const event = eventRows[0]

        if (event.status !== 'ACTIVE') return interaction.reply({ content: "🔒 **Cet événement est fermé ou annulé.** Les inscriptions ne sont plus acceptées", flags: MessageFlags.Ephemeral })

        //* Roles restriction
        if (event.allowed_role_ids)
        { 
            const allowedRoles: string[] = typeof event.allowed_role_ids === 'string'
                ? JSON.parse(event.allowed_role_ids)
                : event.allowed_role_ids

            if (allowedRoles && allowedRoles.length > 0)
            { 
                const member = await interaction.member ?? await interaction.guild?.members.fetch(userId).catch(() => null)
                const hasRequiredRole = member && 'roles' in member && Array.isArray(member.roles)
                    ? member.roles.some((roleId: string) => allowedRoles.includes(roleId))
                    : (member as any)?.roles?.cache?.some((r: any) => allowedRoles.includes(r.id))

                if (!hasRequiredRole) return interaction.reply({ content: "🚫 **Accès refusé.** Vous ne possédez pas l'un des rôles requis pour vous inscrire à cet événement.", flags: MessageFlags.Ephemeral })
            }
        }



        //* Fetch existing note if user already registered
        const rows: any = await ExecuteQuery(
            `SELECT note FROM event_participants WHERE event_id = ? AND user_id = ?`,
            [eventId, interaction.user.id]
        )

        const existingNote = rows.length > 0 ? rows[0].note ?? '' : ''


        //* Build Radio Group for status selection inside Modal
        const statusLabel = new LabelBuilder()
            .setLabel('Statut de participation')
            .setRadioGroupComponent((radioGroup) =>
                radioGroup
                    .setCustomId('participant_status')
                    .addOptions([
                        { label: '🟢 Présent', value: 'PRESENT', default: status === 'PRESENT' },
                        { label: '🟡 Pas sûr', value: 'UNSURE', default: status === 'UNSURE' },
                        { label: '🔴 Absent', value: 'ABSENT', default: status === 'ABSENT' }
                    ])
        )



        const noteLabel = new LabelBuilder()
            .setLabel('Note / Remarque (Optionnel)')
            .setTextInputComponent((comp) =>
                comp
                    .setCustomId('participant_note')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('ex: arrivée vers 21h15, en retard, part à 23h00...')
                    .setValue(existingNote)
                    .setRequired(false)
                    .setMaxLength(255)
            )


        const statusLabels: Record<ParticipationStatus, string> = {
            PRESENT: 'Présent',
            UNSURE: 'Pas sûr',
            ABSENT: 'Absent'
        }


        const modal = new ModalBuilder()
            .setCustomId(`event_submit_presence:${eventId}:${status}`)
            .setTitle(`Confirmation - ${statusLabels[status]}`)
            .addLabelComponents(statusLabel, noteLabel)


        await interaction.showModal(modal)
    }
    catch (error)
    {
        writeLog(`[EventParticipationHandler] Error opening participation modal for event #${eventId}: ${error}`, 'ERROR')

        if (!interaction.replied) await interaction.reply({ content: "❌ Une erreur est survenue lors de l'ouverture du formulaire.", flags: MessageFlags.Ephemeral })
    }
}





/**
 *? Step 2: Triggered when user submits participation modal.
 *? Handles DB Upsert, Waitlist logic & Embed refresh
 */
export async function handleParticipationModalSubmit(interaction: ModalSubmitInteraction)
{ 
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const [, eventId] = interaction.customId.split(':')

    const targetStatus = interaction.fields.getRadioGroup('participant_status') as ParticipationStatus
    const note = interaction.fields.getTextInputValue('participant_note').trim() || null
    const userId = interaction.user.id

    try
    {
        //* Fetch event details
        const eventRows: any = await ExecuteQuery(`SELECT * FROM events WHERE id = ?`, [eventId])

        const event = eventRows[0]

        const previousStatusRows: any = await ExecuteQuery(
            `SELECT status FROM event_participants WHERE event_id = ? AND user_id = ?`,
            [eventId, userId]
        )
        const previousStatus: string | null = previousStatusRows.length > 0 ? previousStatusRows[0].status : null

        //* Determine final status regarding max_players (Waitlist management)
        let dbStatus: 'PRESENT' | 'UNSURE' | 'ABSENT' | 'WAITING_LIST' = targetStatus

        if (targetStatus === 'PRESENT' && event.max_players !== null)
        { 
            const countRows: any = await ExecuteQuery(
                `SELECT COUNT(*) AS total FROM event_participants WHERE event_id = ? AND status = 'PRESENT' AND user_id != ?`,
                [eventId, userId]
            )

            const currentPresenceCount = countRows[0].total

            if (currentPresenceCount >= event.max_players)
            { 
                dbStatus = "WAITING_LIST"
            }
        }


        //* Upsert user participation
        await ExecuteQuery(
            `INSERT INTO event_participants (event_id, user_id, status, note, joined_at)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), updated_at = NOW()`,
            [eventId, userId, dbStatus, note]
        )

        const fredSpot = previousStatus === 'PRESENT' && (dbStatus === 'ABSENT' || dbStatus === 'UNSURE')

        if (fredSpot && event.max_players !== null)
        { 
            const waitlistRows: any = await ExecuteQuery(
                `SELECT user_id FROM event_participants WHERE event_id = ? AND status = 'WAITING_LIST' ORDER BY joined_at ASC LIMIT 1`,
                [eventId]
            )

            if (waitlistRows.length > 0)
            { 
                const promotedUserId = waitlistRows[0].user_id

                await ExecuteQuery(
                    `UPDATE event_participants SET status = 'PRESENT', updated_at = NOW() WHERE event_id = ? AND user_id = ?`,
                    [eventId, promotedUserId]
                )

                const promotedUser = await interaction.client.users.fetch(promotedUserId).catch(() => null)

                if (promotedUser)
                { 
                    await promotedUser.send(
                        `🎉 **Une place s'est libérée !**\nVous avez été promu automatiquement de la liste d'attente vers les **Présents** pour l'événement **${event.title}**`
                    ).catch(() =>
                        writeLog(`[EventParticipationHandler] Could not send promotion DM to user ${promotedUserId}`, 'WARN')
                    )
                }
            }
        }


        //* Fetch updated participants list for Embed rebuilding
        const participants: any = await ExecuteQuery(
            `SELECT user_id AS userId, status, note FROM event_participants WHERE event_id = ? ORDER BY joined_at ASC`,
            [eventId]
        )

        const coOrgIds = typeof event.co_organizer_ids === 'string' ? JSON.parse(event.co_organizer_ids) : event.co_organizer_ids
        const roleIds = typeof event.allowed_role_ids === 'string' ? JSON.parse(event.allowed_role_ids) : event.allowed_role_ids

        const organizer = await interaction.client.users.fetch(event.organizer_id).catch(() => null)
        const organizerName = organizer?.username


        //* Rebuild Embed payload
        const messagePayload = buildEventMessage({
            id: event.id,
            title: event.title,
            description: event.description,
            eventDate: new Date(event.event_date),
            organizerId: event.organizer_id,
            organizerName: organizerName ?? event.organizer_id,
            coOrganizerIds: coOrgIds,
            allowedRoleIds: roleIds,
            minPlayers: event.min_players,
            maxPlayers: event.max_players,
            allowLatecomers: Boolean(event.allow_latecomers),
            status: event.status,
            showDebug: Boolean(event.show_debug)
        }, participants)


        //* Update original Discord message
        const channel = interaction.channel as TextChannel
        if (event.message_id && channel)
        { 
            const originalMessage = await channel.messages.fetch(event.message_id).catch(() => null)

            if (originalMessage) await originalMessage.edit(messagePayload)
        }


        //* Confirms interaction feedback
        if (dbStatus === 'WAITING_LIST')
        {
            await interaction.editReply("⌛ **L'événement est complet.** Vous avez été placé en liste d'attente.")
        }
        else
        { 
            await interaction.editReply("✅ **Votre statut a bien été mis à jour !**")
        }
    }
    catch (error)
    {
        writeLog(`[EventParticipationHandler] Error submitting participation for event #${eventId}: ${error}`, 'ERROR')
        await interaction.editReply("❌ Une erreur est survenue lors de l'enregistrement de votre participation.")
    }
}