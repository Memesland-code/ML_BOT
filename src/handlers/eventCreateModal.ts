import { ExecuteQuery } from "#db/db.js"
import { buildEventMessage } from "#discord/eventEmbedBuilder.js"
import { writeLog } from "#logging/logger.js"
import { MessageFlags, ModalSubmitInteraction, TextChannel } from "discord.js"

export async function handleEventCreateModal(interaction: ModalSubmitInteraction)
{ 
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    // Extract payload from customId (event_create_modal:roleIds:coOrgIds)
    const [, rawRoleIds, rawCoOrgIds] = interaction.customId.split(':')
    const parsedRoleIds = rawRoleIds !== 'none' ? [rawRoleIds] : null
    const parsedCoOrgIds = rawCoOrgIds !== 'none' ? [rawCoOrgIds] : null

    const allowedRoleIds = parsedRoleIds ? JSON.stringify(parsedRoleIds) : null
    const CoOrganizerIds = parsedCoOrgIds ? JSON.stringify(parsedCoOrgIds) : null

    // Extract inputs from modal
    const title = interaction.fields.getTextInputValue('event_title')
    const rawDate = interaction.fields.getTextInputValue('event_date')
    const description = interaction.fields.getTextInputValue('event_description').trim() || null
    const playersCounts = interaction.fields.getTextInputValue('event_players')

    // Parse date (DD/MM/YYYY HH:mm -> YYYY-MM-DD HH:mm:ss)
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
    const match = rawDate.match(dateRegex)

    if (!match) return interaction.editReply("❌ **Format de date invalide.** Veuillez utiliser le format `JJ/MM/AAAA HH:mm` (ex: `15/09/2026 21:00`).")

    const [, day, month, year, hours, minutes] = match
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:00`
    const eventDateObj = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`)

    if (isNaN(eventDateObj.getTime()) || eventDateObj < new Date()) return interaction.editReply("❌ **Date invalide.** La date saisie est soit inexistante, soit déjà passée.")



    // Parse min/max players
    let minPlayers = 0
    let maxPlayers: number | null = null

    if (playersCounts)
    {
        const cleanPlayers = playersCounts.trim()

        if (cleanPlayers.includes('/'))
        {
            const parts = cleanPlayers.split('/')
            const parsedMin = parseInt(parts[0].trim(), 10)
            const parsedMax = parseInt(parts[1].trim(), 10)

            if (isNaN(parsedMin) || isNaN(parsedMax)) return interaction.editReply("❌ **Nombre de joueurs invalide.** Veuillez entrer des nombres valides (ex: 4/8 ou 6).")

            minPlayers = parsedMin
            maxPlayers = parsedMax
        }
        else
        {
            const parsedMin = parseInt(cleanPlayers, 10)
            if (isNaN(parsedMin)) return interaction.editReply("❌ **Nombre de joueurs invalide.** Veuillez entrer des nombres valides (ex: 4/8 ou 6).")

            minPlayers = parsedMin
        }

        if (minPlayers < 0 || (maxPlayers !== null && maxPlayers < 1)) return interaction.editReply("❌ **Nombre de joueurs invalide.** Le nombre de joueurs doit être positif.")

        if (maxPlayers !== null && minPlayers > maxPlayers) return interaction.editReply("❌ **Nombre de joueurs invalide.** Le nombre Min ne peut pas être supérieur à Max.")
    }



    try
    {
        // Database insertion
        const result: any = await ExecuteQuery(
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
                CoOrganizerIds,
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

        const messagePayload = buildEventMessage({
            id: eventId,
            title,
            description,
            eventDate: eventDateObj,
            organizerId: interaction.user.id,
            coOrganizerIds: parsedCoOrgIds,
            allowedRoleIds: parsedRoleIds,
            minPlayers,
            maxPlayers,
            allowLatecomers: true,
            status: 'ACTIVE'
        }, [])


        //* Post embed
        const channel = interaction.channel as TextChannel
        const sentMessage = await channel.send(messagePayload)

        //* Update message_id in DB
        await ExecuteQuery(
            `UPDATE events SET message_id = ? WHERE id = ?`,
            [sentMessage.id, eventId]
        )

        await interaction.editReply({ content: `✅ Événement #${eventId} « ${title} » créé avec succès !` })
    }
    catch (error)
    { 
        writeLog('[EventCreateModalHandler] DB Insert Error: ' + error, 'ERROR')
        return interaction.editReply('❌ Une erreur est survenue lors de l\'enregistrement de l\'événement en base de données. Vérifiez la console pour plus de détails.')
    }
}