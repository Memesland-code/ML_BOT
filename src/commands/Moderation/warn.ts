import { ExecuteQuery } from "#db/db.js"
import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Command } from "@sapphire/framework"
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ComponentType } from "discord.js"

export class WarnCommand extends Command
{ 
    public constructor(context: Command.LoaderContext, options: Command.Options)
    { 
        super(context, {
            ...options,
            name: 'warn',
            description: 'Système de gestion des warns',
            preconditions: ['GuildOnly', 'ModeratorsOnly'],
        })        
    }

    public override registerApplicationCommands(registry: Command.Registry)
    { 
        registry.registerChatInputCommand((builder) => 
            builder
                .setName(this.name)
                .setDescription(this.description)

                // Subcommand Add
                .addSubcommand((subcommand) => 
                    subcommand
                        .setName('add')
                        .setDescription('Warn un membre et le stocke dans la base de données')
                        .addUserOption((option) =>
                            option
                                .setName('member')
                                .setDescription('Le membre à avertir')
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName('reason')
                                .setDescription('La raison de l\'avertissement')
                                .setRequired(true)
                        )
                )

                // Subcommand List
                .addSubcommand((subcommand) => 
                    subcommand
                        .setName('list')
                        .setDescription('Affiche la liste des warns d\'un membre')
                        .addUserOption((option) => 
                            option
                                .setName('member')
                                .setDescription('Le membre pour lequel lister les warns')
                                .setRequired(true)
                        )
                )

                // Subcommand Remove
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('remove')
                        .setDescription('Retire le warn d\'un membre')
                        .addIntegerOption((option) =>
                        option
                            .setName('id')
                            .setDescription('ID de l\'avertissement à retirer')
                            .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName('reason')
                                .setDescription('La raison de retrait du warn')
                                .setRequired(true)

                        )
                )
        )
    }

    public async chatInputRun(interaction: ChatInputCommandInteraction)
    { 
        const subcommand = interaction.options.getSubcommand()

        switch (subcommand)
        { 
            case 'add':
                return this.handleAdd(interaction)
            case 'list':
                return this.handleList(interaction)
            case 'remove':
                return this.handleRemove(interaction)
            default:
                return interaction.reply({content: 'Commande invalide !', flags: ['Ephemeral']})
        }
    }



    // --- Subcommand Handlers ---



    private async handleAdd(interaction: ChatInputCommandInteraction)
    { 
        await interaction.deferReply()

        const targetUser = interaction.options.getUser('member', true)
        const reason = interaction.options.getString('reason', true)
        const executor = interaction.user
        const guild = interaction.guild

        if (!guild) return interaction.editReply({ content: '❌ Erreur : guild introuvable' })

        if (targetUser.bot) return interaction.editReply({ content: '❌ Erreur : vous ne pouvez pas warn un bot' })

        if (targetUser.id === executor.id) return interaction.editReply({ content: '❌ Erreur : vous ne pouvez pas vous warn vous-même' })

        const query = `
        INSERT INTO Warnings (GuildID, TargetUsername, TargetID, ExecutorUsername, ExecutorID, Reason)
        VALUES (?, ?, ?, ?, ?, ?)
        `

        const values = [
            guild.id,
            targetUser.username.substring(0, 32),
            targetUser.id,
            executor.username.substring(0, 32),
            executor.id,
            reason
        ]

        await ExecuteQuery(query, values)

        // Console log
        const logString = formatEventLog({
            eventName: 'Warn Command Executed',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'high',
            executor: { name: executor.username, id: executor.id },
            details: {
                'Target': targetUser.tag,
                'Target ID': targetUser.id,
                'Reason': reason
            }
        })

        await writeLog(logString)

        // Discord log
        const logsChannel = await getGuildLogChannel(guild, 'high')
        if (!logsChannel) return

        const embed = createLogEmbed({
            title: '⚠️ Member warned',
            color: 'DarkVividPink',
            author: { name: targetUser.username, iconURL: targetUser.displayAvatarURL() },
            executor,
            fields: [
                { name: 'Member warned', value: `${targetUser} (${targetUser.id})`},
                { name: 'Executor', value: `${executor} (${executor.id})`},
                { name: 'Reason', value: reason}
            ]
        })

        await logsChannel.send({ embeds: [embed] })

        return interaction.editReply({content: `✅ Le membre **${targetUser.username}** a été warn pour la raison : \`${reason}\``})
    }



    private async handleList(interaction: ChatInputCommandInteraction)
    { 
        await interaction.deferReply()

        const targetUser = interaction.options.getUser('member', true)
        const guild = interaction.guild

        if (!guild) return interaction.editReply({ content: '❌ Erreur : guild introuvable' })

        const query = `
        SELECT ID, ExecutorUsername, ExecutorID, Timestamp, Reason FROM Warnings
        WHERE GuildID = ? AND TargetID = ?
        ORDER BY Timestamp DESC
        `
        const results = await ExecuteQuery(query, [guild.id, targetUser.id]) as WarningRow[]

        if (!results || results.length === 0) return interaction.editReply({ content: `✅ Aucun avertissement trouvé pour **<@${targetUser.id}>**` })

        const maxDisplay = Math.min(results.length, 25)
        const embedFields = []

        for (let i = 0; i < maxDisplay; i++)
        { 
            const warn = results[i]
            const warnDate = new Date(warn.Timestamp).toLocaleString()

            embedFields.push({
                name: `Entry ${i + 1}`,
                value: `\`\`\`md\n[ID de warn interne][${warn.ID}]\n\n[Par le modérateur][${warn.ExecutorUsername}]\n[ID du modérateur][${warn.ExecutorID}]\n\n[Date et heure du warn][${warnDate}]\n\n[Raison][${warn.Reason}]\n\n\`\`\``
            })
        }


        // Discord log
        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        const embed = createLogEmbed({
            title: `📂 ${results.length} warn trouvé(s)`,
            color: 'Blurple',
            author: {
                name: targetUser.username,
                iconURL: targetUser.displayAvatarURL()
            },
            fields: embedFields
        })

        let contentMessage = ''

        if (results.length > 25)
        { 
            contentMessage += `⚠️ *Seuls les 25 derniers avertissements sont affichés !*`
        }

        return interaction.editReply({ content: contentMessage, embeds: [embed] })
    }



    private async handleRemove(interaction: ChatInputCommandInteraction)
    { 
        await interaction.deferReply()

        const warnId = interaction.options.getInteger('id', true)
        const deletionReason = interaction.options.getString('reason', true)
        const guild = interaction.guild

        if (!guild) return interaction.editReply({ content: '❌ Erreur : guild introuvable' })

        const selectQuery = `
        SELECT ID, TargetUsername, TargetID, ExecutorUsername, ExecutorID, Timestamp, Reason
        FROM Warnings WHERE ID = ? AND GuildID = ?
        `
        const results = await ExecuteQuery(selectQuery, [warnId, guild.id]) as WarningRow[]

        if (!results || results.length === 0) return interaction.editReply({ content: `❌ Erreur : aucun warn trouvé avec l'ID **${warnId}**` })

        const warn = results[0]

        const warnDate = new Date(warn.Timestamp).toLocaleString()

        const sharedEmbedFields = [
            {
                name: 'ID Interne',
                value: `${warn.ID.toString()}`
            },
            {
                name: 'Membre warn',
                value: `<@${warn.TargetID}> (${warn.TargetID})`
            },
            {
                name: 'Auteur du warn',
                value: `<@${warn.ExecutorID}> (${warn.ExecutorID})`
            },
            {
                name: 'Date et heure du warn',
                value: `${warnDate}`
            },
            {
                name: 'Raison du warn',
                value: `${warn.Reason}`
            }
        ]


        const confirmEmbed = createLogEmbed({
            title: `❓ Confirmez la suppression du warn #${warnId}`,
            color: 'DarkVividPink',
            executor: interaction.user,
            fields: sharedEmbedFields
        })

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_delete_warn')
            .setLabel('Confirmer')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('⚠️')

        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton)


        const responseMessage = await interaction.editReply({ embeds: [confirmEmbed], components: [confirmRow] })

        const collectorFilter = (i: ButtonInteraction) => i.user.id === interaction.user.id

        try
        {
            const buttonInteraction = await responseMessage.awaitMessageComponent({ filter: collectorFilter, time: 30_000, componentType: ComponentType.Button })

            if (buttonInteraction.customId === 'confirm_delete_warn')
            { 
                await ExecuteQuery('DELETE FROM Warnings WHERE ID = ? AND GuildID = ?', [warnId, guild.id])

                const finalLogField = [
                    ...sharedEmbedFields,
                    {
                    name: '\u200b',
                    value: '\u200b',
                    },
                    {
                        name: 'Raison de la suppression du warn',
                        value: `${deletionReason}`
                    }
                ]

                const deletedLogEmbed = createLogEmbed({
                    title: 'Warn supprimé',
                    color: 'Red',
                    executor: interaction.user,
                    fields: finalLogField
                })

                const logString = formatEventLog({
                    eventName: 'Warn deleted',
                    guildName: guild.name,
                    guildId: guild.id,
                    severity: 'high',
                    executor: { name: interaction.user.username, id: interaction.user.id },
                    details: {
                        'Warn ID': warnId.toString(),
                        'Target name': warn.TargetUsername,
                        'Target ID': warn.TargetID,
                        'Deletion reason': deletionReason
                    }
                })

                await writeLog(logString)

                const logsChannel = await getGuildLogChannel(guild, 'high')
                if (logsChannel) await logsChannel.send({ embeds: [deletedLogEmbed] })

                confirmButton.setDisabled(true).setLabel('Action confirmée')
                const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton)

                await buttonInteraction.update({embeds: [deletedLogEmbed], components: [disabledRow]})
            }
        }
        catch (error)
        {
            confirmButton.setDisabled(true).setLabel('Annulé (délai expiré)')
            const timeoutRow = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton)

            await interaction.editReply({ components: [timeoutRow] })
        }
    }
}

export interface WarningRow
{ 
    ID: number,
    GuildID: string,
    TargetUsername: string,
    TargetID: string,
    ExecutorUsername: string,
    ExecutorID: string,
    Timestamp: Date,
    Reason: string | null
}