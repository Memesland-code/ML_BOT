import { ExecuteQuery } from "#db/db.js"
import { buildEventMessage } from "#discord/eventInfoBuilder.js"
import { writeLog } from "#logging/logger.js"
import { ActionRowBuilder, APIRadioGroupOption, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, LabelBuilder, MessageFlags, ModalBuilder, ModalSubmitInteraction, RadioGroupOptionBuilder, RestOrArray, RoleSelectMenuBuilder, TextChannel, TextInputStyle, UserSelectMenuBuilder } from "discord.js"

/**
 ** Check if the interacting user is allowed to manage the event
 */
async function isAuthorized(interaction: ButtonInteraction | ModalSubmitInteraction, event: any): Promise<boolean>
{ 
    const userId = interaction.user.id

    if (event.organizer_id === userId) return true

    const coOrgIds: string[] = typeof event.co_organizer_ids === 'string'
        ? JSON.parse(event.co_organizer_ids)
        : (event.co_organizer_ids || [])

    if (coOrgIds.includes(userId)) return true

    const owners = process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',').map(id => id.trim()) : []

    return owners.includes(userId)
}



/**
 ** Triggered when user clicks manage button
 ** Shows ephemeral management panel with action buttons
 */
export async function handleManageButtonClick(interaction: ButtonInteraction)
{ 
    const eventId = interaction.customId.split(":")[2]

    try
    {
        const rows: any = await ExecuteQuery(`SELECT * FROM events WHERE id = ?`, [eventId])

        if (!rows || rows.length === 0) return interaction.reply({ content: "❌ **Événément introuvable.**", flags: MessageFlags.Ephemeral })

        const event = rows[0]

        if (!(await isAuthorized(interaction, event))) return interaction.reply({ content: "🚫 **Accès refusé.** Seuls l'organisateur, les co-organisateurs & les propriétaires du bot peuvent gérer cet événement.", flags: MessageFlags.Ephemeral })

        const isClosed = event.status === 'CLOSED'

        const editDetailsBtn = new ButtonBuilder()
            .setCustomId(`event_manage_edit_details:${eventId}`)
            .setLabel('Modifier les détails')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📝')

        const editRolesCoOrgsBtn = new ButtonBuilder()
            .setCustomId(`event_manage_edit_setup:${eventId}`)
            .setLabel('Rôles & Co-orgs')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🛡️')

        const toggleLockBtn = new ButtonBuilder()
            .setCustomId(`event_manage_toggle_lock:${eventId}`)
            .setLabel(isClosed ? 'Ouvrir les inscriptions' : 'Fermer les inscriptions')
            .setStyle(isClosed ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setEmoji(isClosed ? '🔓' : '🔒')

        const cancelEventBtn = new ButtonBuilder()
            .setCustomId(`event_manage_cancel:${eventId}`)
            .setLabel('Annuler l\'événement')
            .setStyle(ButtonStyle.Danger)

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            editDetailsBtn,
            editRolesCoOrgsBtn,
            toggleLockBtn,
            cancelEventBtn
        )

        await interaction.reply({ content: `⚙️ **Panneau de gestion - événement #${eventId} « ${event.title} »**\nChoisissez une action ci-dessous :`, components: [row], flags: MessageFlags.Ephemeral })
    }
    catch (error)
    {
        writeLog(`[eventManageHandler] Error opening management panel for event #${eventId}: ${error}`, 'ERROR')
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
        if (!rows || rows.length === 0) return interaction.reply({ content: "❌ **Événément introuvable.**", flags: MessageFlags.Ephemeral })

        const event = rows[0]

        // Format Date back to DD/MM/YYYY HH:mm
        const dateObj = new Date(event.event_date)
        const day = String(dateObj.getDate()).padStart(2, '0')
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const year = dateObj.getFullYear()
        const hours = String(dateObj.getHours()).padStart(2, '0')
        const minutes = String(dateObj.getMinutes()).padStart(2, '0')
        const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`


        let playersStr = ''
        if (event.min_players >= 0 && event.max_players !== null) playersStr = `${event.min_players}/${event.max_players}`
        else if (event.min_players >= 0) playersStr = `${event.min_players}`



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


        const latecomersOptions: RestOrArray<APIRadioGroupOption | RadioGroupOptionBuilder> = []

        if (event.allow_latecomers)
        {
            latecomersOptions.push(
            { label: '🟢 Autoriser', value: 'true', default: Boolean(event.allow_latecomers) },
            { label: '🔴 Ne pas autoriser', value: 'false' }
            )
        }
        else
        { 
            latecomersOptions.push(
            { label: '🟢 Autoriser', value: 'true' },
            { label: '🔴 Ne pas autoriser', value: 'false', default: Boolean(event.allow_latecomers) }
            )
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
        writeLog(`[eventManageHandler] Error opening edit modal for event #${eventId}: ${error}`, 'ERROR')
    }
}



/**
 ** Triggered when submitting the edit details modal
 */
export async function handleEditModalSubmit(interaction: ModalSubmitInteraction)
{ 
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const eventId = interaction.customId.split(":")[1]

    const title = interaction.fields.getTextInputValue('event_title')
    const rawDate = interaction.fields.getTextInputValue('event_date')
    const description = interaction.fields.getTextInputValue('event_description').trim() || null
    const playersCounts = interaction.fields.getTextInputValue('event_players')
    const allowLatecomers = interaction.fields.getRadioGroup('event_latecomers') === 'true'



    // Parse date
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
    const match = rawDate.match(dateRegex)
    if (!match) return interaction.editReply("❌ **Format de date invalide.** Format requis : `JJ/MM/AAAA HH:mm`.")

    const [, day, month, year, hours, minutes] = match
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:00`



    // Parse min/max players
    let minPlayers = 0
    let maxPlayers: number | null = null

    if (playersCounts)
    {
        const cleanPlayers = playersCounts.trim()
        if (cleanPlayers.includes('/'))
        {
            const parts = cleanPlayers.split('/')
            minPlayers = parseInt(parts[0].trim(), 10) || 0
            maxPlayers = parseInt(parts[1].trim(), 10) || null
        }
        else
        {
            minPlayers = parseInt(cleanPlayers, 10) || 0
        }
    }



    try
    {
        await ExecuteQuery(
            `UPDATE events SET title = ?, description = ?, event_date = ?, min_players = ?, max_players = ?, allow_latecomers = ? WHERE id = ?`,
            [title, description, formattedDate, minPlayers, maxPlayers, allowLatecomers, eventId]
        )

        const eventRows: any = await ExecuteQuery(`SELECT * FROM events WHERE id = ?`, [eventId])
        const event = eventRows[0]

        const participants: any = await ExecuteQuery(
            `SELECT user_id AS userId, status, note FROM event_participants WHERE event_id = ? ORDER BY joined_at ASC`,
            [eventId]
        )

        const coOrgIds = typeof event.co_organizer_ids === 'string' ? JSON.parse(event.co_organizer_ids) : event.co_organizer_ids
        const roleIds = typeof event.allowed_role_ids === 'string' ? JSON.parse(event.allowed_role_ids) : event.allowed_role_ids

        const organizer = await interaction.client.users.fetch(event.organizer_id).catch(() => null)
        const organizerName = organizer?.username


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



        const channel = interaction.channel as TextChannel
        if (event.message_id && channel)
        { 
            const originalMessage = await channel.messages.fetch(event.message_id).catch(() => null)
            if (originalMessage) await originalMessage.edit(messagePayload)
        }

        await interaction.editReply("✅ **Les détails de l'événement ont été mis à jour avec succès !**")
    }
    catch (error)
    {
        writeLog(`[eventManageHandler] Error updating event #${eventId}: ${error}`, 'ERROR')
        await interaction.editReply("❌ Une erreur est survenue lors de la mise à jour de l'événement.")
    }
}



/**
 ** Triggered when clicking Roles & Co-orgs
 ** Re-sends the Phase 2 selection menus
 */
export async function handleEditSetupButtonClick(interaction: ButtonInteraction)
{
    const eventId = interaction.customId.split(':')[1]

    try
    {
        const rows: any = await ExecuteQuery(
            `SELECT allowed_role_ids, co_organizer_ids FROM events WHERE id = ?`,
            [eventId]
        )

        if (!rows || rows.length === 0) return

        const event = rows[0]

        const currentRoles: string[] = typeof event.allowed_role_ids === 'string'
            ? JSON.parse(event.allowed_role_ids)
            : (event.allowed_role_ids || [])

        const currentCoOrgs: string[] = typeof event.co_organizer_ids === 'string'
            ? JSON.parse(event.co_organizer_ids)
            : (event.co_organizer_ids || [])


        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId(`event_setup_roles:${eventId}`)
            .setPlaceholder('🔒 Rôles autorisés (Optionnel)')
            .setMinValues(0)
            .setMaxValues(10)

        if (currentRoles.length > 0)
        {
            roleSelect.setDefaultRoles(currentRoles)
        }


        const userSelect = new UserSelectMenuBuilder()
            .setCustomId(`event_setup_coorgs:${eventId}`)
            .setPlaceholder('🖊️ Co-organisateurs (Optionnel)')
            .setMinValues(0)
            .setMaxValues(10)

        if (currentCoOrgs.length > 0)
        {
            userSelect.setDefaultUsers(currentCoOrgs)
        }


        const row1 = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleSelect)
        const row2 = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(userSelect)

        await interaction.reply({
        content: `🛡️ **Modification des accès (Événement #${eventId})**\nSélectionnez les nouveaux rôles autorisés ou co-organisateurs ci-dessous :`,
        components: [row1, row2],
        flags: MessageFlags.Ephemeral
    })
    }
    catch (error)
    {
        writeLog(`[eventManageHandler] Error opening edit setup panel for event #${eventId}: ${error}`, 'ERROR')
    }
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
    const targetStatus = interaction.options.getString('status') as 'PRESENT' | 'UNSURE' | 'ABSENT'
    const note = interaction.options.getString('note')?.trim() || null
    const bypassCapacity = interaction.options.getBoolean('bypass_capacity') ?? false

    if (!removeUser && !targetStatus) return interaction.editReply("❌ **Option manquante.** Vous devez spécifier un status OU passer 'remove_user' à true.")


    try
    {
        const eventRows: any = await ExecuteQuery(`SELECT * FROM events WHERE id = ?`, [eventId])
        if (!eventRows || eventRows.length === 0) return interaction.editReply("❌ **Événement introuvable.**")

        const event = eventRows[0]

        if (!(await isAuthorized(interaction as any, event))) return interaction.editReply("🚫 **Accès refusé.** Vous n'avez pas la permission de gérer les membres de cet événement.")

        const previousStatusRows: any = await ExecuteQuery(
            `SELECT status FROM event_participants WHERE event_id = ? AND user_id = ?`,
            [eventId, targetUser.id]
        )
        const previousStatus: string | null = previousStatusRows.length > 0 ? previousStatusRows[0] : null


        if (removeUser)
        {
            await ExecuteQuery(
                `DELETE FROM event_participants WHERE event_id = ? AND user_id = ?`,
                [eventId, targetUser.id]
            )

            await targetUser.send(
                `🛠️ **Mise à jour d'événement**\nVous avez été retiré de la liste de l'événement **${event.title}** par ${interaction.user.username}.`
            ).catch(() =>
            {
                writeLog(`[eventManageHandler] Could not send DM to user ${targetUser.id}`, 'WARN')
            })


            if (previousStatus === 'PRESENT' && event.max_players !== null)
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
                            `🎉 **Une place s'est libérée !**\nVous avez été promu automatiquement de la liste d'attente vers les **Présents** pour l'événement **${event.title}** !`
                        ).catch(() =>
                        {
                            writeLog(`[eventManageHandler] Could not send promotion DM to user ${promotedUserId}`, 'WARN')
                        })
                    }
                }
            }
        }
        else
        { 
            let dbStatus: 'PRESENT' | 'UNSURE' | 'ABSENT' | 'WAITING_LIST' = targetStatus
    
            if (targetStatus === 'PRESENT' && event.max_players !== null && !bypassCapacity)
            { 
                const countRows: any = await ExecuteQuery(
                    `SELECT COUNT(*) AS total FROM event_participants WHERE event_id = ? AND status = 'PRESENT' AND user_id != ?`,
                    [eventId, targetUser.id]
                )
    
                if (countRows[0].total >= event.max_players)
                { 
                    dbStatus = 'WAITING_LIST'
                }
            }
    
    
    
            await ExecuteQuery(
                `INSERT INTO event_participants (event_id, user_id, status, note, joined_at)
                VALUES (?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), updated_at = NOW()`,
                [eventId, targetUser.id, dbStatus, note]
            )
    
    
            const statusLabels: Record<string, string> = {
                PRESENT: '🟢 Présent',
                UNSURE: '🟡 Pas sûr',
                ABSENT: '🔴 Absent',
                WAITING_LIST: '⌛ Liste d\'attente'
            }
    
            await targetUser.send(
                `🛠️ **Mise à jour d'événement**\nUn organisateur a modifié votre statut pour l'événement **${event.title}** :\n• **Nouveau statut :** ${statusLabels[dbStatus]}${note ? `\n• **Note :** ${note}` : ''}`
            ).catch(() => {
                writeLog(`[eventManageHandler] Could not send DM to user ${targetUser.id}`, 'WARN')
            })
            
        }



        const participants: any = await ExecuteQuery(
            `SELECT user_id AS userId, status, note FROM event_participants WHERE event_id = ? ORDER BY joined_at ASC`,
            [eventId]
        )

        const coOrgIds = typeof event.co_organizer_ids === 'string' ? JSON.parse(event.co_organizer_ids) : event.co_organizer_ids
        const roleIds = typeof event.allowed_role_ids === 'string' ? JSON.parse(event.allowed_role_ids) : event.allowed_role_ids

        const organizer = await interaction.client.users.fetch(event.organizer_id).catch(() => null)
        const organizerName = organizer?.username


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


        const channel = interaction.channel as TextChannel
        if (event.message_id && channel)
        { 
            const originalMessage = await channel.messages.fetch(event.message_id).catch(() => null)
            if (originalMessage) await originalMessage.edit(messagePayload)
        }


        if (removeUser) await interaction.editReply(`✅ **<@${targetUser.id}> a été retiré de l'événement avec succès !**`)
        else await interaction.editReply(`✅ **Statut de <@${targetUser.id}> mis à jour avec succès !**`)
    }
    catch (error)
    {
        writeLog(`[eventManageHandler] Error executing admin manage command for event #${eventId}: ${error}`, 'ERROR')
        await interaction.editReply("❌ Une erreur est survenue lors de la gestion du membre.")
    }
}



/**
 ** Triggered when clicking Close or Open registration
 ** Toggles event status between 'ACTIVE' and 'CLOSED'
 */
export async function handleToggleLockButtonClick(interaction: ButtonInteraction)
{ 
    await interaction.deferUpdate()
    const eventId = interaction.customId.split(":")[1]

    try
    { 
        const rows: any = await ExecuteQuery(`SELECT * FROM events WHERE id = ?`, [eventId])
        if (!rows || rows.length === 0) return

        const event = rows[0]

        // Toggle status
        const newStatus = event.status === 'CLOSED' ? 'ACTIVE' : 'CLOSED'

        await ExecuteQuery(`UPDATE events SET status = ? WHERE id = ?`, [newStatus, eventId])

        // Refresh public embed
        const participants: any = await ExecuteQuery(
            `SELECT user_id AS userId, status, note FROM event_participants WHERE event_id = ? ORDER BY joined_at ASC`,
            [eventId]
        )

        const coOrgIds = typeof event.co_organizer_ids === 'string' ? JSON.parse(event.co_organizer_ids) : event.co_organizer_ids
        const roleIds = typeof event.allowed_role_ids === 'string' ? JSON.parse(event.allowed_role_ids) : event.allowed_role_ids

        const messagePayload = buildEventMessage({
            id: event.id,
            title: event.title,
            description: event.description,
            eventDate: new Date(event.event_date),
            organizerId: event.organizer_id,
            organizerName: event.organizer_name ?? event.organizer_id,
            coOrganizerIds: coOrgIds,
            allowedRoleIds: roleIds,
            minPlayers: event.min_players,
            maxPlayers: event.max_players,
            allowLatecomers: Boolean(event.allow_latecomers),
            status: newStatus,
            showDebug: Boolean(event.show_debug)
        }, participants)

        const channel = interaction.channel as TextChannel
        if (event.message_id && channel)
        {
            const originalMessage = await channel.messages.fetch(event.message_id).catch(() => null)
            if (originalMessage) await originalMessage.edit(messagePayload)
        }

        const actionText = newStatus === 'CLOSED' ? 'fermées' : 'rouvertes'
        await interaction.editReply({
            content: `🔒 **Les inscriptions ont été ${actionText} avec succès !**`,
            components: []
        })
    }
    catch (error)
    {
        writeLog(`[eventManageHandler] Error toggling lock for event #${eventId}: ${error}`, 'ERROR')
    }
}



/**
 ** Triggered when clicking Canncel event
 ** Changes status to 'CANCELLED', disables public buttons and notifies participants
 */
export async function handleCancelEventButtonClick(interaction: ButtonInteraction)
{
    await interaction.deferUpdate()
    const eventId = interaction.customId.split(':')[1]

    try
    {
        const rows: any = await ExecuteQuery(`SELECT * FROM events WHERE id = ?`, [eventId])
        if (!rows || rows.length === 0) return

        const event = rows[0]

        // Update status to CANCELLED in DB
        await ExecuteQuery(`UPDATE events SET status = 'CANCELLED' WHERE id = ?`, [eventId])

        // Fetch participants to notify them
        const participants: any = await ExecuteQuery(
            `SELECT user_id AS userId, status, note FROM event_participants WHERE event_id = ? ORDER BY joined_at ASC`,
            [eventId]
        )

        // Refresh public embed (buildEventMessage will apply red color and disable buttons)
        const coOrgIds = typeof event.co_organizer_ids === 'string' ? JSON.parse(event.co_organizer_ids) : event.co_organizer_ids
        const roleIds = typeof event.allowed_role_ids === 'string' ? JSON.parse(event.allowed_role_ids) : event.allowed_role_ids

        const messagePayload = buildEventMessage({
            id: event.id,
            title: event.title,
            description: event.description,
            eventDate: new Date(event.event_date),
            organizerId: event.organizer_id,
            organizerName: event.organizer_name ?? event.organizer_id,
            coOrganizerIds: coOrgIds,
            allowedRoleIds: roleIds,
            minPlayers: event.min_players,
            maxPlayers: event.max_players,
            allowLatecomers: Boolean(event.allow_latecomers),
            status: 'CANCELLED',
            showDebug: Boolean(event.show_debug)
        }, participants)

        const channel = interaction.channel as TextChannel
        if (event.message_id && channel)
        {
            const originalMessage = await channel.messages.fetch(event.message_id).catch(() => null)
            if (originalMessage) await originalMessage.edit(messagePayload)
        }

        // Send DM notification to all non-absent participants
        const activeParticipants = participants.filter((p: any) => p.status !== 'ABSENT')
        for (const p of activeParticipants)
        {
            const user = await interaction.client.users.fetch(p.userId).catch(() => null)
            if (user)
            {
                await user.send(`🚨 **Événement Annulé**\nL'événement **${event.title}** auquel vous étiez inscrit a été annulé par ${interaction.user.username}.`).catch(() => null)
            }
        }

        await interaction.editReply({
            content: `🛑 **L'événement « ${event.title} » a été annulé et les participants ont été notifiés.**`,
            components: []
        })
    }
    catch (error)
    {
        writeLog(`[eventManageHandler] Error cancelling event #${eventId}: ${error}`, 'ERROR')
    }
}