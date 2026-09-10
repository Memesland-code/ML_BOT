import { ExecuteQuery } from "#db/db.js"
import { buildEventMessage } from "#discord/eventEmbedBuilder.js"
import { writeLog } from "#logging/logger.js"
import { ButtonInteraction, MessageFlags, RoleSelectMenuInteraction, TextChannel, UserSelectMenuInteraction } from "discord.js"

/**
 ** Update allowed role IDs in DB when RoleSelectMenu is submitted
 */
export async function handleRoleSelect(interaction: RoleSelectMenuInteraction)
{ 
    await interaction.deferUpdate()
    const eventId = interaction.customId.split(":")[1]
    const selectedRoles = interaction.values.length > 0 ? JSON.stringify(interaction.values) : null

    try
    {
        await ExecuteQuery(
            `UPDATE events SET allowed_role_ids = ? WHERE id = ?`,
            [selectedRoles, eventId]
        )
    }
    catch (error)
    {
        writeLog(`[eventSetupHandlerPhase2] Error while updating roles for event #${eventId}: ${error}`, "ERROR")
    }
}



/**
 ** Update co-organizer IDs in DB when UserSelectMenu is submitted
 */
export async function handleCoOrgSelect(interaction: UserSelectMenuInteraction)
{ 
    await interaction.deferUpdate()
    const eventId = interaction.customId.split(":")[1]
    const selectedUsers = interaction.values.length > 0 ? JSON.stringify(interaction.values) : null

    try
    {
        await ExecuteQuery(
            `UPDATE events SET co_organizer_ids = ? WHERE id = ?`,
            [selectedUsers, eventId]
        )    
    }
    catch (error)
    {
        writeLog(`[eventSetupHandlerPhase2] Error while updating roles for event #${eventId}: ${error}`, "ERROR")
    }
}



/**
 ** Final publish button: Build embed, post to channel & clean ephemeral message
 */
export async function handlePublishEvent(interaction: ButtonInteraction)
{ 
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const eventId = interaction.customId.split(":")[1]

    try
    {
        const rows: any = await ExecuteQuery(
            `SELECT * FROM events WHERE id = ?`,
            [eventId]
        )

        if (!rows || rows.length === 0) return interaction.editReply("❌ **Événement introuvable.** Il a peut-être été supprimé.")

        const event = rows[0]

        // Check if string before parsing, else keep array as is
        const coOrgIds = typeof event.co_organizer_ids === 'string'
            ? JSON.parse(event.co_organizer_ids)
            : (event.co_organizer_ids || null)

        const roleIds = typeof event.co_organizer_ids === 'string'
            ? JSON.parse(event.allowed_role_ids)
            : (event.allowed_role_ids || null)

        const participants: any = await ExecuteQuery(
            `SELECT user_id AS userId, status, note FROM event_participants WHERE event_id = ?`,
            [eventId]
        )



        //* Build embed & ActionRow payload
        const messagePayload = buildEventMessage({
            id: event.id,
            title: event.title,
            description: event.description,
            eventDate: new Date(event.event_date),
            organizerId: event.organizer_id,
            organizerName: interaction.user.displayName,
            coOrganizerIds: coOrgIds,
            allowedRoleIds: roleIds,
            minPlayers: event.min_players,
            maxPlayers: event.max_players,
            allowLatecomers: Boolean(event.allow_latecomers),
            status: event.status,
            showDebug: Boolean(event.show_debug)
        }, participants)


        //* Post embed
        const channel = interaction.channel as TextChannel
        const sentMessage = await channel.send(messagePayload)


        //* Update message_id in DB
        await ExecuteQuery(
            `UPDATE events SET message_id = ? WHERE id = ?`,
            [sentMessage.id, eventId]
        )

        //* Delete ephemeral setup message
        await interaction.message.delete().catch(() => { })


        await interaction.editReply({ content: `✅ Événement #${eventId} « ${event.title} » publié avec succès !` })
    }
    catch (error)
    {
        writeLog(`[eventSetupHandlerPhase2] Error publishing event ${eventId} : ${error}`, 'ERROR')
        return interaction.editReply("❌ Une erreur est survenue lors de la publication de l'événement.")
    }
}