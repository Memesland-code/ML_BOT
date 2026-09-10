import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, time, TimestampStyles } from "discord.js"

export interface EventData
{ 
    id: number
    title: string
    description: string | null
    eventDate: Date
    organizerId: string
    organizerName?: string
    coOrganizerIds: string[] | null
    allowedRoleIds: string[] | null
    minPlayers: number
    maxPlayers: number | null
    allowLatecomers: boolean
    status: 'ACTIVE' | 'CLOSED' | 'CANCELLED'
}

export interface ParticipantData {
    userId: string
    status: 'PRESENT' | 'MAYBE' | 'ABSENT' | 'WAITING_LIST'
    note: string | null
}



export function buildEventMessage(event: EventData, participants: ParticipantData[] = [])
{ 
    //* Group participants
    const attending = participants.filter(p => p.status === 'PRESENT')
    const tentative = participants.filter(p => p.status === 'MAYBE')
    const declined = participants.filter(p => p.status === 'ABSENT')
    const waitlist = participants.filter(p => p.status === 'WAITING_LIST')



    //* Determine Dynamic Color Scheme
    let color = 0x808080 // Grey (Sign-ups open, min_players not reached)

    if (event.status === 'CANCELLED')
    {
        color = 0xED4245 // Red
    }
    else if (event.maxPlayers !== null && attending.length >= event.maxPlayers)
    {
        color = 0x58148C // Dark Purple (Full / Waitlist active)
    }
    else if (event.maxPlayers !== null && (event.maxPlayers - attending.length <= 2))
    {
        color = 0xFEE75C // Gold (1 or 2 spots remaining)
    }
    else if (attending.length >= event.minPlayers)
    {
        color = 0x57F287 // Green (Threshold reached)
    }



    //* Format Date Timestamps
    const dateTimestamp = Math.floor(event.eventDate.getTime() / 1000)
    const formattedDate = `${time(dateTimestamp, TimestampStyles.FullDateShortTime)} (${time(dateTimestamp, TimestampStyles.RelativeTime)})`



    // Players capacity string (Min / Max)
    let playersStr = 'Pas de prérequis'

    if (event.minPlayers > 0 && event.maxPlayers !== null)
    {
        playersStr = `Entre ${event.minPlayers} & ${event.maxPlayers}`
    }
    else if (event.minPlayers > 0)
    {
        playersStr = `${event.minPlayers} minimum`
    }



    //* Helper to format user lists with notes
    const formatUserList = (list: ParticipantData[]) => 
    {
        if (list.length === 0) return '*Aucun*'

        return list.map(p => 
        {
            const noteStr = p.note ? ` — *"${p.note}"*` : ''
            return `• <@${p.userId}>${noteStr}`
        }).join('\n')
    }



    //* Build Embed
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`📄 ${event.title}`)

    if (event.description)
    { 
        embed.setDescription(`📝 **Description :**\n${event.description}`)
    }

    let infoValue = `• 📅 **Date & Heure :** ${formattedDate}\n\n`
    infoValue += `• 👥 **Joueurs Min/Max :** ${playersStr}\n\n`
    infoValue += `• 🚪 **Arrivées tardives :** ${event.allowLatecomers ? '🟢 Autorisées' : '🔴 Non autorisées'}`

    embed.addFields({ name: '📌 Informations', value: infoValue, inline: false })


    // Conditionnal fields: Co-organizers & Roles
    if (event.coOrganizerIds && event.coOrganizerIds.length > 0)
    { 
        embed.addFields({ name: '\u200b', value: '\u200e' })

        const coOrgsStr = event.coOrganizerIds.map(id => `<@${id}>`).join(', ')
        embed.addFields({ name: '🖊️ Co-organisateurs', value: coOrgsStr, inline: true })
    }

    if (event.allowedRoleIds && event.allowedRoleIds.length > 0)
    { 
        const rolesStr = event.allowedRoleIds.map(id => `<@&${id}>`).join(', ')
        embed.addFields({ name: '🔒 Rôle(s) requis', value: rolesStr, inline: true })
    }



    embed.addFields({ name: '\u200b', value: '\u200e' })

    // Participants Fields
    embed.addFields(
        { name: `🟢 Présents (${attending.length})`, value: formatUserList(attending), inline: false },
        { name: `🟡 Incertains (${tentative.length})`, value: formatUserList(tentative), inline: false },
        { name: `🔴 Absents (${declined.length})`, value: formatUserList(declined), inline: false },
        {name: `⌛ Liste d'attente (${waitlist.length})`, value: formatUserList(waitlist), inline: false}
    )

    const organizerLabel = event.organizerName ?? `${event.organizerId}`
    const formattedUpdate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' à')

    embed.setFooter({ text: `Organisé par ${organizerLabel} • Mis à jour le ${formattedUpdate}` })



    // Action Row Buttons
    const isDisabled = event.status !== 'ACTIVE'

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`event:attending:${event.id}`)
            .setLabel('Présent')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🟢')
            .setDisabled(isDisabled),

        new ButtonBuilder()
            .setCustomId(`event:tentative:${event.id}`)
            .setLabel('Incertain')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🟡')
            .setDisabled(isDisabled),

        new ButtonBuilder()
            .setCustomId(`event:declined:${event.id}`)
            .setLabel('Absent')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔴')
            .setDisabled(isDisabled),

        new ButtonBuilder()
            .setCustomId(`event:manage:${event.id}`)
            .setLabel('Gérer')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⚙️')
    )

    return { embeds: [embed], components: [row] }
}