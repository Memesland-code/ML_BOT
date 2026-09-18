import { ExecuteQuery } from "#db/db.js"
import { writeLog } from "#logging/logger.js"
import { parseJsonArray, promoteWaitlistFIFO, updateEventMessage } from "#utils/eventHelpers.js"
import { ButtonInteraction, LabelBuilder, MessageFlags, ModalBuilder, ModalSubmitInteraction, TextInputStyle } from "discord.js"

type ParticipationStatus = 'PRESENT' | 'UNSURE' | 'ABSENT'

/**
 *? Step 1: Triggered when user click Present, Unsure or Absent button.
 *? Opens a modal with their existing note pre-filled if present
 */
export async function handleParticipationButtonClick(interaction: ButtonInteraction, status: ParticipationStatus) 
{ 
    const eventId = interaction.customId.split(":")[2]
    
    try
    {
        //* Fetch event details to check status and allowed roles before submitting Modal
        const eventRows: any = await ExecuteQuery(`SELECT status, allowed_role_ids FROM events WHERE id = ?`, [eventId])

        if (!eventRows || eventRows.length === 0) return interaction.reply({ content: "❌ **Événement introuvable.**", flags: MessageFlags.Ephemeral })

        const event = eventRows[0]

        if (event.status !== 'ACTIVE') return interaction.reply({ content: "🔒 **Cet événement est fermé ou annulé.** Les inscriptions ne sont plus acceptées", flags: MessageFlags.Ephemeral })


        //* Roles restriction
        const allowedRoles = parseJsonArray(event.allowed_role_ids)
        if (allowedRoles.length > 0) { 
            const member = await interaction.guild?.members.fetch(interaction.user.id).catch(() => null)

            const hasRequiredRole = member?.roles.cache.some(r => allowedRoles.includes(r.id))

            if (!hasRequiredRole) return interaction.reply({ content: "🚫 **Accès refusé.** Vous ne possédez pas l'un des rôles requis pour vous inscrire à cet événement.", flags: MessageFlags.Ephemeral })
        }


        //* Fetch existing note if user already registered
        const rows: any = await ExecuteQuery(`SELECT note FROM event_participants WHERE event_id = ? AND user_id = ?`, [eventId, interaction.user.id])

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
    const parts = interaction.customId.split(':')
    const eventId = Number(parts[1])
    const targetStatus = parts[2] as ParticipationStatus
    const note = interaction.fields.getTextInputValue('participant_note').trim() || null

    try
    {
        const eventRows: any = await ExecuteQuery(`SELECT * FROM events WHERE id = ?`, [eventId])
        const event = eventRows[0]

        const previousRows: any = await ExecuteQuery(`SELECT status FROM event_participants WHERE event_id = ? AND user_id = ?`, [eventId, interaction.user.id])
        const previousStatus = previousRows.length > 0 ? previousRows[0].status : null

        let dbStatus: 'PRESENT' | 'UNSURE' | 'ABSENT' | 'WAITING_LIST' = targetStatus


        if (targetStatus === 'PRESENT' && event.max_players !== null) { 
            const countRows: any = await ExecuteQuery(`SELECT COUNT(*) AS total FROM event_participants WHERE event_id = ? AND status = 'PRESENT' AND user_id != ?`, [eventId, interaction.user.id])
            if (countRows[0].total >= event.max_players) dbStatus = 'WAITING_LIST'
        }


        await ExecuteQuery(
            `INSERT INTO event_participants (event_id, user_id, status, note, joined_at) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), updated_at = NOW()`,
            [eventId, interaction.user.id, dbStatus, note]
        )


        if (previousStatus === 'PRESENT' && (dbStatus === 'ABSENT' || dbStatus === 'UNSURE') && event.max_players !== null) { 
            await promoteWaitlistFIFO(eventId, event.title, interaction.client)
        }


        await updateEventMessage(eventId, interaction.client)

        await interaction.editReply(dbStatus === 'WAITING_LIST' ? "⌛ **Placé en liste d'attente.**" : "✅ **Statut mis à jour !**")
    }
    catch (error)
    {
        writeLog(`[EventManageHandler] Error cancelling event #${eventId}: ${error}`, 'ERROR')
        await interaction.editReply("❌ Erreur.")
    }
}