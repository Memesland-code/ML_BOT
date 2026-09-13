import { ExecuteQuery } from "#db/db.js"
import { writeLog } from "#logging/logger.js"
import { parseEventDate, parsePlayersCount, updateEventMessage } from "#utils/eventHelpers.js"
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, MessageFlags, ModalSubmitInteraction, RoleSelectMenuBuilder, RoleSelectMenuInteraction, TextChannel, UserSelectMenuBuilder, UserSelectMenuInteraction } from "discord.js"

export async function handleEventCreateModal(interaction: ModalSubmitInteraction)
{ 
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const showDebug = interaction.customId.split(":")[1] === 'true'
    const title = interaction.fields.getTextInputValue('event_title')
    const description = interaction.fields.getTextInputValue('event_description').trim() || null
    const allowLatecomers = interaction.fields.getRadioGroup('event_latecomers') === 'true'

    const formattedDate = parseEventDate(interaction.fields.getTextInputValue('event_date'))
    if (!formattedDate) return interaction.editReply("❌ **Date invalide ou format incorrect.** Utilisez `JJ/MM/AAAA HH:mm`.")

    const players = parsePlayersCount(interaction.fields.getTextInputValue('event_players'))
    if (!players) return interaction.editReply("❌ **Nombre de joueurs invalide.** (ex: 4/8 ou 6).")

    try {
        const result: any = await ExecuteQuery(
            `INSERT INTO events (message_id, channel_id, guild_id, organizer_id, title, description, event_date, min_players, max_players, allow_latecomers, status, show_debug) 
            VALUES ('PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
            [interaction.channelId, interaction.guildId, interaction.user.id, title, description, formattedDate, players.min, players.max, allowLatecomers, showDebug]
        )

        const eventId = result.insertId

        const roleSelect = new RoleSelectMenuBuilder().setCustomId(`event_setup_roles:${eventId}`).setPlaceholder('🔒 Rôles autorisés').setMinValues(0).setMaxValues(10)
        const userSelect = new UserSelectMenuBuilder().setCustomId(`event_setup_coorgs:${eventId}`).setPlaceholder('🖊️ Co-organisateurs').setMinValues(0).setMaxValues(10)
        const publishBtn = new ButtonBuilder().setCustomId(`event_setup_publish:${eventId}`).setLabel("Publier l'événement").setStyle(ButtonStyle.Success).setEmoji('🚀')

        await interaction.editReply({
            content: `🛠️ **Configuration (2/2)**\nChoisissez les rôles autorisés et les co-organisateurs ci-dessous.`,
            components: [
                new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleSelect),
                new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(userSelect),
                new ActionRowBuilder<ButtonBuilder>().addComponents(publishBtn)
            ]
        })
    } catch (error) { 
        writeLog(`[EventSetup] DB Insert Error: ${error}`, 'ERROR')
        await interaction.editReply("❌ Une erreur est survenue lors de l'enregistrement.")
    }
}



export async function handleRoleSelect(interaction: RoleSelectMenuInteraction)
{ 
    await interaction.deferUpdate()
    await ExecuteQuery(`UPDATE events SET allowed_role_ids = ? WHERE id = ?`, [interaction.values.length > 0 ? JSON.stringify(interaction.values) : null, interaction.customId.split(":")[1]])
}



export async function handleCoOrgSelect(interaction: UserSelectMenuInteraction)
{ 
    await interaction.deferUpdate()
    await ExecuteQuery(`UPDATE events SET co_organizer_ids = ? WHERE id = ?`, [interaction.values.length > 0 ? JSON.stringify(interaction.values) : null, interaction.customId.split(":")[1]])
}



export async function handlePublishEvent(interaction: ButtonInteraction) 
{ 
    await interaction.deferUpdate()
    const eventId = Number(interaction.customId.split(":")[1])

    try {
        const messagePayload = await updateEventMessage(eventId, interaction.client, true)
        if (!messagePayload) return interaction.editReply("❌ **Événement introuvable.**")

        const channel = interaction.channel as TextChannel
        const sentMessage = await channel.send(messagePayload)

        await ExecuteQuery(`UPDATE events SET message_id = ? WHERE id = ?`, [sentMessage.id, eventId])
        await interaction.editReply({ content: `✅ Événement publié avec succès !`, components: [] })
    } catch (error) {
        writeLog(`[EventSetup] Error publishing: ${error}`, 'ERROR')
        await interaction.editReply("❌ Erreur de publication.")
    }
}