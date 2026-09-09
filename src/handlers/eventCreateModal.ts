import { ExecuteQuery } from "#db/db.js"
import { writeLog } from "#logging/logger.js"
import { container, err } from "@sapphire/framework"
import { ModalSubmitInteraction } from "discord.js"
import { format } from "node:path"

export async function handleEventCreateModal(interaction: ModalSubmitInteraction)
{ 
    await interaction.deferReply({ flags: "Ephemeral" })

    // Extract payload from customId (event_create_modal:roleIds:coOrgIds)
    const [, rawRoleIds, rawCoOrgIds] = interaction.customId.split(':')
    const allowedRoleIds = rawRoleIds !== 'none' ? JSON.stringify([rawRoleIds]) : null
    const coOrganizerIds = rawCoOrgIds !== 'none' ? JSON.stringify([rawCoOrgIds]) : null

    // Extract inputs from modal
    const title = interaction.fields.getTextInputValue('event_title')
    const rawDate = interaction.fields.getTextInputValue('event_date')
    const description = interaction.fields.getTextInputValue('event_description')
    const playersCounts = interaction.fields.getTextInputValue('event_players')

    // Parse date (DD/MM/YYYY HH:mm -> YYYY-MM-DD HH:mm:ss)
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
    const match = rawDate.match(dateRegex)

    if (!match) return interaction.editReply("❌ **Format de date invalide.** Veuillez utiliser le format `JJ/MM/AAAA HH:mm` (ex: `15/09/2026 21:00`)")

    const [, day, month, year, hours, minutes] = match
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:00`
    const eventDateObj = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`)

    if (isNaN(eventDateObj.getTime()) || eventDateObj < new Date()) return interaction.editReply("❌ **Date invalide.** La date saisie est soit inexistante, soit déjà passée")



    // Parse min/max players
    let minPlayers = 0
    let maxPlayers: number | null = null

    if (playersCounts)
    {
        if (playersCounts.includes('/'))
        {
            const [minStr, maxStr] = playersCounts.split('/')
            minPlayers = parseInt(minStr.trim(), 10) || 0
            maxPlayers = parseInt(maxStr.trim(), 10) || null
        }
        else
        {
            minPlayers = parseInt(playersCounts.trim(), 10)
        }
    }



    try
    {
        // Database insertion
        const [result]: any = await ExecuteQuery(
            `INSERT INTO events (
                message_id, channel_id, guild_id, organizer_id, 
                co_organizer_ids, title, description, event_date, 
                min_players, max_players, allow_latecomers, allowed_role_ids, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'PENDING', //? Temporary placeholder until Embed is sent
                interaction.channelId,
                interaction.guildId,
                interaction.user.id,
                coOrganizerIds,
                title,
                description,
                formattedDate,
                minPlayers,
                maxPlayers,
                true,
                allowedRoleIds,
                'ACTIVE'
            ]
        )

        const eventId = result.insertId

        await interaction.editReply({ content: `✅ Événement #${eventId} créé en base de données avec succès` })
    }
    catch (error)
    { 
        writeLog('[EventCreateModalHandler] DB Insert Error: ' + error, 'ERROR')
        return interaction.editReply('❌ Une erreur est survenue lors de l\'enregistrement de l\'événement en base de données. Vérifiez la console pour plus de détails.')
    }
}