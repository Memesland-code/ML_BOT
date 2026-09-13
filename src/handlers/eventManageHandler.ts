import { ExecuteQuery } from "#db/db.js"
import { writeLog } from "#logging/logger.js"
import { demoteWaitlistLIFO, isAuthorized, parseEventDate, parseJsonArray, parsePlayersCount, promoteWaitlistFIFO, sendAdminUpdateDM, updateEventMessage } from "#utils/eventHelpers"
import { ActionRowBuilder, APIRadioGroupOption, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, LabelBuilder, MessageFlags, ModalBuilder, ModalSubmitInteraction, RadioGroupOptionBuilder, RestOrArray, RoleSelectMenuBuilder, TextInputStyle, UserSelectMenuBuilder } from "discord.js"



/**
 ** Triggered when user clicks manage button
 ** Shows ephemeral management panel with action buttons
 */
export async function handleManageButtonClick(interaction: ButtonInteraction) 
{ 
    const eventId = interaction.customId.split(":")[2]
    try {
        const rows: any = await ExecuteQuery(`SELECT * FROM events WHERE id = ?`, [eventId])
        if (!rows || rows.length === 0) return interaction.reply({ content: "❌ **Événement introuvable.**", flags: MessageFlags.Ephemeral })

        if (!(await isAuthorized(interaction, rows[0]))) return interaction.reply({ content: "🚫 **Accès refusé.**", flags: MessageFlags.Ephemeral })

        const isClosed = rows[0].status === 'CLOSED'
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`event_manage_edit_details:${eventId}`)
                .setLabel('Modifier détails')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝'),
            new ButtonBuilder()
                .setCustomId(`event_manage_edit_setup:${eventId}`)
                .setLabel('Rôles & Co-orgs')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🛡️'),
            new ButtonBuilder()
                .setCustomId(`event_manage_toggle_lock:${eventId}`)
                .setLabel(isClosed ? 'Ouvrir' : 'Fermer')
                .setStyle(isClosed ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji(isClosed ? '🔓' : '🔒'),
            new ButtonBuilder()
                .setCustomId(`event_manage_cancel:${eventId}`)
                .setLabel('Annuler l\'événement')
                .setStyle(ButtonStyle.Danger)
        )

        await interaction.reply({ content: `⚙️ **Gestion événement #${eventId}**`, components: [row], flags: MessageFlags.Ephemeral })
    }
    catch (error)
    {
        writeLog(`[EventManageHandler] Error panel: ${error}`, 'ERROR')
    }
}



/**
 ** Triggered when clicking modify details
 ** Opens the pre-filled modal
 */
export async function handleEditDetailsButtonClick(interaction: ButtonInteraction) 
{ 
    const eventId = interaction.customId.split(":")[1]

    try
    {
        const rows: any = await ExecuteQuery(`SELECT * FROM events WHERE id = ?`, [eventId])
        if (!rows || rows.length === 0) return
        const event = rows[0]

        const date = new Date(event.event_date)
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        const playersStr = event.min_players >= 0 && event.max_players !== null ? `${event.min_players}/${event.max_players}` : (event.min_players >= 0 ? `${event.min_players}` : '')



        const titleLabel = new LabelBuilder()
            .setLabel("Titre de l'événement")
            .setTextInputComponent((comp) =>
                comp
                    .setCustomId('event_title')
                    .setStyle(TextInputStyle.Short)
                    .setValue(event.title)
                    .setPlaceholder("ex: Soirée sur Garry's Mod")
                    .setRequired(true)
                    .setMaxLength(255)
            )

        const dateLabel = new LabelBuilder()
            .setLabel("Date et Heure au format DD/MM/YYYY HH:mm")
            .setTextInputComponent((comp) =>
                comp
                    .setCustomId('event_date')
                    .setStyle(TextInputStyle.Short)
                    .setValue(formattedDate)
                    .setPlaceholder("ex: 15/09/2026 21:00")
                    .setRequired(true)
                    .setMaxLength(16)
            )

        const descriptionLabel = new LabelBuilder()
            .setLabel("Description / Détails")
            .setTextInputComponent((comp) =>
                comp
                    .setCustomId('event_description')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(event.description ?? '')
                    .setPlaceholder("Détails de l'événement, prérequis, etc.")
                    .setRequired(false)
            )

        const playersLabel = new LabelBuilder()
            .setLabel("Nombre de joueurs Min/Max OU Min")
            .setTextInputComponent((comp) =>
                comp
                    .setCustomId('event_players')
                    .setStyle(TextInputStyle.Short)
                    .setValue(playersStr)
                    .setPlaceholder("Format: Min/Max OU Min | ex. 4/8 ou 5")
                    .setRequired(false)
            )

        let latecomersOptions: RestOrArray<APIRadioGroupOption | RadioGroupOptionBuilder> = [
            { label: '🟢 Autoriser', value: 'true', default: true },
            { label: '🔴 Ne pas autoriser', value: 'false' }
        ]

        if (!Boolean(event.allow_latecomers))
        { 
            latecomersOptions = [
            { label: '🟢 Autoriser', value: 'true' },
            { label: '🔴 Ne pas autoriser', value: 'false', default: true }
            ]
        }

        const latecomersLabel = new LabelBuilder()
            .setLabel("Autoriser les arrivées tardives ?")
            .setRadioGroupComponent((radioGroup) =>
                radioGroup
                    .setCustomId('event_latecomers')
                    .addOptions(latecomersOptions)
            .setRequired(true)
            )



        const modal = new ModalBuilder()
            .setCustomId(`event_edit_modal:${eventId}`)
            .setTitle(`Modifier l'événement #${eventId}`)
            .addLabelComponents(titleLabel, dateLabel, descriptionLabel, playersLabel, latecomersLabel)

        await interaction.showModal(modal)
    }
    catch (error)
    {
        writeLog(`[EventManageHandler] An error occured while opening modal: ${error}`, 'ERROR')

    }
}



/**
 ** Triggered when submitting the edit details modal
 */
export async function handleEditModalSubmit(interaction: ModalSubmitInteraction) 
{ 
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const eventId = Number(interaction.customId.split(":")[1])

    const title = interaction.fields.getTextInputValue('event_title')
    const formattedDate = parseEventDate(interaction.fields.getTextInputValue('event_date'))
    const players = parsePlayersCount(interaction.fields.getTextInputValue('event_players'))
    const allowLatecomers = interaction.fields.getRadioGroup('event_latecomers') === 'true'

    if (!formattedDate) return interaction.editReply("❌ **Format de date invalide.** Format requis : `JJ/MM/AAAA HH:mm`.")
        
    if (!players) return interaction.editReply("❌ **Erreur de formatage des joueurs.**")


    try {
        await ExecuteQuery(`UPDATE events SET title = ?, description = ?, event_date = ?, min_players = ?, max_players = ?, allow_latecomers = ? WHERE id = ?`, 
            [title, interaction.fields.getTextInputValue('event_description').trim() || null, formattedDate, players.min, players.max, allowLatecomers, eventId])


        if (players.max !== null)
        { 
            const countRows: any = await ExecuteQuery(
                `SELECT COUNT(*) AS total FROM event_participants WHERE event_id = ? AND status = 'PRESENT'`,
                [eventId]
            )
            const currentCount = Number(countRows[0].total)

            if (currentCount > players.max)
            {
                await demoteWaitlistLIFO(eventId, players.max, title, interaction.client)
            }
            else if (currentCount < players.max)
            {
                const availableSpots = players.max - currentCount
                await promoteWaitlistFIFO(eventId, title, interaction.client, availableSpots)
            }
            else
            { 
                const countRows: any = await ExecuteQuery(
                    `SELECT COUNT(*) AS total FROM event_participants WHERE event_id = ? AND status = 'WAITING_LIST'`,
                    [eventId]
                )
                const waitlistCount = Number(countRows[0].total)

                if (waitlistCount > 0) await promoteWaitlistFIFO(eventId, title, interaction.client, waitlistCount)
            }
        }
            
        await updateEventMessage(eventId, interaction.client, false, interaction.user.username)
        await interaction.editReply(`✅ Les détails de l'événement #${eventId} ont été mis à jour avec succès !`)
    }
    catch (error)
    {
        writeLog(`[HandleEditModalSubmit] An error occured while sending edit Modal: ${error}`, 'ERROR')
        await interaction.editReply("❌ Une erreur est survenue pendant le traitement du formulaire.")
    }
}



/**
 ** Triggered when clicking Roles & Co-orgs
 ** Re-sends the Phase 2 selection menus
 */
export async function handleEditSetupButtonClick(interaction: ButtonInteraction)
{
    const eventId = interaction.customId.split(':')[1]
    const rows: any = await ExecuteQuery(`SELECT allowed_role_ids, co_organizer_ids FROM events WHERE id = ?`, [eventId])
    if (!rows || rows.length === 0) return

    const roleSelect = new RoleSelectMenuBuilder().setCustomId(`event_setup_roles:${eventId}`).setPlaceholder('🔒 Rôles autorisés').setMinValues(0).setMaxValues(10)
    const userSelect = new UserSelectMenuBuilder().setCustomId(`event_setup_coorgs:${eventId}`).setPlaceholder('🖊️ Co-organisateurs').setMinValues(0).setMaxValues(10)

    const currentRoles = parseJsonArray(rows[0].allowed_role_ids)
    if (currentRoles.length > 0) roleSelect.setDefaultRoles(currentRoles)

    const currentCoOrgs = parseJsonArray(rows[0].co_organizer_ids)
    if (currentCoOrgs.length > 0) userSelect.setDefaultUsers(currentCoOrgs)

    await interaction.reply({
        content: `🛡️ **Modification des accès**`,
        components: [new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleSelect), new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(userSelect)],
        flags: MessageFlags.Ephemeral
    })
}



/**
 ** Triggered when clicking Close or Open registration
 ** Toggles event status between 'ACTIVE' and 'CLOSED'
 */
export async function handleToggleLockButtonClick(interaction: ButtonInteraction) 
{ 
    await interaction.deferUpdate()
    const eventId = Number(interaction.customId.split(":")[1])
    const rows: any = await ExecuteQuery(`SELECT status FROM events WHERE id = ?`, [eventId])
    if (!rows || rows.length === 0) return

    const newStatus = rows[0].status === 'CLOSED' ? 'ACTIVE' : 'CLOSED'
    await ExecuteQuery(`UPDATE events SET status = ? WHERE id = ?`, [newStatus, eventId])
    await updateEventMessage(eventId, interaction.client, false, interaction.user.username)
    await interaction.editReply({ content: `🔒 **Inscriptions ${newStatus === 'CLOSED' ? 'fermées' : 'rouvertes'} !**`, components: [] })
}



/**
 ** Triggered when clicking Canncel event
 ** Changes status to 'CANCELLED', disables public buttons and notifies participants
 */
export async function handleCancelEventButtonClick(interaction: ButtonInteraction)
{
    await interaction.deferUpdate()
    const eventId = Number(interaction.customId.split(':')[1])
    const rows: any = await ExecuteQuery(`SELECT title FROM events WHERE id = ?`, [eventId])
    if (!rows || rows.length === 0) return

    await ExecuteQuery(`UPDATE events SET status = 'CANCELLED' WHERE id = ?`, [eventId])
    await updateEventMessage(eventId, interaction.client, false, interaction.user.username)

    const participants: any = await ExecuteQuery(`SELECT user_id FROM event_participants WHERE event_id = ? AND status != 'ABSENT'`, [eventId])
    for (const p of participants) {
        const user = await interaction.client.users.fetch(p.user_id).catch(() => null)
        if (user) await user.send(`🚨 Événement annulé\nL'événement **${rows[0].title}** auquel vous étiez inscrit a été annulé par ${interaction.user.username}.`).catch(() => null)
    }

    await interaction.editReply({ content: `🛑 **L'événement a été annulé.**`, components: [] })
}



/**
 ** Triggered when command to manage event is executed
 ** Manages a full user registration
 */
export async function handleAdminManageCommand(interaction: ChatInputCommandInteraction)
{ 
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const eventId = interaction.options.getInteger('event_id', true)
    const targetUser = interaction.options.getUser('user', true)
    const removeUser = interaction.options.getBoolean('remove_user') ?? false
    const targetStatus = interaction.options.getString('status') as 'PRESENT' | 'UNSURE' | 'ABSENT' | 'WAITING_LIST' | null
    const note = interaction.options.getString('note')?.trim() || null
    
    if (!removeUser && !targetStatus) return interaction.editReply("❌ Option manquante : status ou remove_user.")

    try {
        const eventRows: any = await ExecuteQuery(`SELECT * FROM events WHERE id = ?`, [eventId])
        if (!eventRows || eventRows.length === 0) return interaction.editReply("❌ **Événement introuvable.**")
        
        const event = eventRows[0]
        if (!(await isAuthorized(interaction as any, event))) return interaction.editReply("🚫 **Accès refusé.**")

        const previousStatusRows: any = await ExecuteQuery(`SELECT status FROM event_participants WHERE event_id = ? AND user_id = ?`, [eventId, targetUser.id])
        const previousStatus = previousStatusRows.length > 0 ? previousStatusRows[0].status : null

        let finalStatus: 'PRESENT' | 'UNSURE' | 'ABSENT' | 'WAITING_LIST' | 'REMOVED'

        if (removeUser) {
            await ExecuteQuery(`DELETE FROM event_participants WHERE event_id = ? AND user_id = ?`, [eventId, targetUser.id])
            finalStatus = 'REMOVED'

            if (previousStatus === 'PRESENT') await promoteWaitlistFIFO(eventId, event.title, interaction.client, 1)
        }
        else
        { 
            let dbStatus = targetStatus!
            if (targetStatus === 'PRESENT' && event.max_players !== null && !(interaction.options.getBoolean('bypass_capacity') ?? false))
            { 
                const countRows: any = await ExecuteQuery(`SELECT COUNT(*) AS total FROM event_participants WHERE event_id = ? AND status = 'PRESENT' AND user_id != ?`, [eventId, targetUser.id])

                if (Number(countRows[0].total) >= event.max_players) dbStatus = 'WAITING_LIST'
            }
            await ExecuteQuery(
                `INSERT INTO event_participants (event_id, user_id, status, note, joined_at) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), updated_at = NOW()`,
                [eventId, targetUser.id, dbStatus, note]
            )

            finalStatus = dbStatus

            if (previousStatus === 'PRESENT' && (dbStatus === 'ABSENT' || dbStatus === 'UNSURE' || dbStatus === 'WAITING_LIST'))
            { 
                await promoteWaitlistFIFO(eventId, event.title, interaction.client, 1)
            }
        }

        await sendAdminUpdateDM(targetUser, event.title, interaction.user.username, finalStatus, note)

        await updateEventMessage(eventId, interaction.client, false, interaction.user.username)

        await interaction.editReply(`✅ **${removeUser ? `<@${targetUser.id}> a été retiré de l'événement` : `Statut de <@${targetUser.id}> mis à jour`}** avec succès !`)
    }
    catch (error)
    {
        writeLog(`[eventManageHandler] Error executing admin manage command for event #${eventId}: ${error}`, 'ERROR')
        await interaction.editReply("❌ Une erreur est survenue lors de la gestion du membre.")
    }
}





