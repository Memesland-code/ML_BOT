import { ExecuteQuery } from "#db/db.js"
import { writeLog } from "#logging/logger.js"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ModalSubmitInteraction, RoleSelectMenuBuilder, UserSelectMenuBuilder } from "discord.js"

export async function handleEventCreateModal(interaction: ModalSubmitInteraction)
{ 
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const [, rawShowDebug] = interaction.customId.split(":")
    const showDebug = rawShowDebug === 'true'

    // Extract inputs from modal
    const title = interaction.fields.getTextInputValue('event_title')
    const rawDate = interaction.fields.getTextInputValue('event_date')
    const description = interaction.fields.getTextInputValue('event_description').trim() || null
    const playersCounts = interaction.fields.getTextInputValue('event_players')
    const allowLatecomers = interaction.fields.getRadioGroup('event_latecomers') === 'true'

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
                min_players, max_players, allow_latecomers, allowed_role_ids, status, show_debug
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'PENDING', //? Temporary placeholder until Embed is sent
                interaction.channelId,
                interaction.guildId,
                interaction.user.id,
                null,
                title,
                description,
                formattedDate,
                minPlayers,
                maxPlayers,
                allowLatecomers,
                null,
                'ACTIVE',
                showDebug
            ]
        )

        const eventId = result.insertId


        //? Build Phase 2/2 - Ephemeral Setup Select Menus (for roles filter and co-organizers)
        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId(`event_setup_roles:${eventId}`)
            .setPlaceholder('🔒 Rôles autorisés (Optionnel)')
            .setMinValues(0)
            .setMaxValues(10);

        const userSelect = new UserSelectMenuBuilder()
            .setCustomId(`event_setup_coorgs:${eventId}`)
            .setPlaceholder('🖊️ Co-organisateurs (Optionnel)')
            .setMinValues(0)
            .setMaxValues(10);

        const publishBtn = new ButtonBuilder()
            .setCustomId(`event_setup_publish:${eventId}`)
            .setLabel("Publier l'événement")
            .setStyle(ButtonStyle.Success)
            .setEmoji('🚀');


        const row1 = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleSelect)
        const row2 = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(userSelect)
        const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(publishBtn)

        await interaction.editReply({
            content: `🛠️ **Configuration de l'événement (2/2)**\nChoisissez les rôles autorisés et les co-organisateurs ci-dessous si nécessaire avant de cliquer sur **Publier l'événement**.`,
            components: [row1, row2, row3]
        })
    }
    catch (error)
    { 
        writeLog('[EventCreateModalHandler] DB Insert Error: ' + error, 'ERROR')
        return interaction.editReply('❌ Une erreur est survenue lors de l\'enregistrement de l\'événement en base de données. Vérifiez la console pour plus de détails.')
    }
}