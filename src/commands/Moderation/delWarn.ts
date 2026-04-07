import colors from "colors"
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js"
import { CommandObject, CommandType } from "wokcommands"
import { botAdmins, client } from "../.."
import { CheckTableExist, ExecuteQuery, GetHighLogChannel, HandleLog, IsBotPerformingMaintenance } from "../../utils/functions"

export default {
    description: "Delete a warning from database",
    type: CommandType.SLASH,
    guildOnly: true,
    permissions: [PermissionFlagsBits.Administrator],
    ownerOnly: false,
    options: [
        {
            name: "warnid",
            description: "Warn ID to delete",
            required: true,
            type: ApplicationCommandOptionType.Number
        },
        {
            name: "reason",
            description: "Reason of deleting warn",
            required: true,
            type: ApplicationCommandOptionType.String
        }
    ],

    callback: async ({ interaction }) => {

        if (!interaction) return
        let guild = interaction.guildId

        let guildHighLogsChannelID = await GetHighLogChannel(guild as string)
        let highLogsChannel = client.channels.cache.get(guildHighLogsChannelID) as TextChannel

        try {
            //* Basic check for bot maintenance
            let interactor: string = interaction?.user.id!
            if (await IsBotPerformingMaintenance() && !botAdmins.includes(interactor)) {
                interaction?.reply({ content: "Vous ne pouvez pas effectuer de commandes pour l'instant, maintenance du bot en cours...", flags: ['Ephemeral'] })
                return
            }

            interface Warn {
                WarnID: number;
                UserID: string;
                WarnDateAndTime: Date;
                WarnExecutorID: string;
                WarnReason: string;
            }

            if (await CheckTableExist(`WARNINGS_${interaction?.guildId}`) == false) {
                await ExecuteQuery(`CREATE TABLE WARNINGS_${interaction?.guildId} (WarnID int AUTO_INCREMENT UNIQUE, UserID VARCHAR(20), WarnDateAndTime DATETIME, WarnExecutorID BIGINT, WarnReason VARCHAR(1024));`)
            }

            // Get warn corresponding ID
            const results: Warn[] = await ExecuteQuery(`SELECT * FROM WARNINGS_${interaction?.guildId} WHERE WarnID = '${interaction.options.getNumber("warnid")}';`)

            if (results.length == 0) {
                interaction?.reply({ content: `No warn entry found with warn ID ${interaction.options.getNumber("warnid")}!` })
                return
            }

            // Construct log embed
            const embedLog = new EmbedBuilder()
                .setAuthor({ name: `${interaction?.user?.username}`, iconURL: `${interaction?.user?.displayAvatarURL()}` })
                .setTitle(`A warn entry was deleted`)
                .setColor("DarkVividPink")
                .addFields(
                    {
                        name: `Entry deleted`, value: `\`\`\`md
                        [Internal warn ID][${results[0].WarnID}]\n
                        [Warned user][${client.users.cache.get(String(results[0].UserID))?.username}]
                        [Warned user ID][${results[0].UserID}]\n
                        [Warn date and time][${new Date(results[0].WarnDateAndTime).toLocaleString()}]\n
                        [Warn Executor][${client.users.cache.get(String(results[0].WarnExecutorID))?.username}]
                        [Warn executor ID][${results[0].WarnExecutorID}]\n
                        [Warn reason][${results[0].WarnReason}]\n
                        \`\`\``.split("\n").map(line => line.trim()).join("\n")
                    },
                    { name: `Warn deletion reason`, value: `${interaction.options.getString("reason")}` }
                )
                .setFooter({ text: `${new Date().toLocaleString()}` })



            // Construct confirmation embed
            const confirmActionEmbed = new EmbedBuilder()
                .setAuthor({ name: `${interaction?.user.username}`, iconURL: `${interaction?.user.avatarURL()}` })
                .setTitle(`Please confirm that you want to delete entry ${interaction.options.getNumber("warnid")}`)
                .setColor("DarkVividPink")
                .addFields({
                    name: `Entry informations`, value: `\`\`\`md
                    [Internal warn ID][${results[0].WarnID}]\n
                    [Warned user][${client.users.cache.get(String(results[0].UserID))?.username}]
                    [Warned user ID][${results[0].UserID}]\n
                    [Warn date and time][${new Date(results[0].WarnDateAndTime).toLocaleString()}]\n
                    [Warn Executor][${client.users.cache.get(String(results[0].WarnExecutorID))?.username}]
                    [Warn executor ID][${results[0].WarnExecutorID}]\n
                    [Warn reason][${results[0].WarnReason}]\n
                    \`\`\``.split("\n").map(line => line.trim()).join("\n")
                })

            // Construct confirmation button
            const confirmButton = new ButtonBuilder()
                .setCustomId("confirm")
                .setLabel("Confirm")
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⚠️')

            // Construct confirmation row
            const confirmRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(confirmButton)

            // Send message and store ref
            const confirmationMessage = await interaction?.reply({ embeds: [confirmActionEmbed], components: [confirmRow] })

            // Create a filter so only the interacting user can click the button
            const collectorFilter = (i: any) => i.user.id === interaction?.user.id

            try {
                // Create a listener checking for an interaction on the message's row, applying the filter and for 30s
                const buttonClickListener = await confirmationMessage?.awaitMessageComponent({ filter: collectorFilter, time: 30_000 })

                // On button click
                if (buttonClickListener?.customId === "confirm") {
                    // Delete entry in DB
                    await ExecuteQuery(`DELETE FROM WARNINGS_${interaction?.guildId} WHERE WarnID = '${interaction.options.getNumber("warnid")}'`)

                    await HandleLog(
                        colors.yellow(`Command executed\ndelWarn`) +
                        colors.yellow(`In server : `) + colors.white(`${interaction.guild?.name}`) +
                        colors.yellow(`Server ID : `) + colors.white(`${interaction.guildId}`) +
                        colors.yellow(`WarnID : `) + colors.white(`${results[0].WarnID}`) +
                        colors.yellow(`Warned user : `) + colors.white(`${client.users.cache.get(String(results[0].UserID))?.username}`) +
                        colors.yellow(`Warned user ID : `) + colors.white(`${results[0].UserID}`) +
                        colors.yellow(`Warn date and time : `) + colors.white(`${new Date(results[0].WarnDateAndTime).toLocaleString()}`) +
                        colors.yellow(`Warn executor : `) + colors.white(`${client.users.cache.get(String(results[0].WarnExecutorID))?.username}`) +
                        colors.yellow(`Warn executor ID : `) + colors.white(`][${results[0].WarnExecutorID}`) +
                        colors.yellow(`Warn reason : `) + colors.white(`${results[0].WarnReason}`) +
                        colors.cyan(`${new Date().toLocaleString()}\n`)
                    )

                    // Send action log to logs channel
                    highLogsChannel.send({ embeds: [embedLog] })

                    // Change the button label and make it unclickable
                    confirmRow.components[0].setDisabled(true)
                    confirmRow.components[0].setLabel("Action confirmed")
                    buttonClickListener.update({ embeds: [embedLog], components: [confirmRow] })
                }
            } catch (error) {
                confirmRow.components[0].setDisabled(true)
                confirmRow.components[0].setLabel("Canceled")
                interaction?.editReply({ embeds: [confirmActionEmbed], components: [confirmRow] })
            }
        } catch (error) {

            await HandleLog(colors.red(`An error occured when running command ${interaction.commandName}\n${error}`))
            await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on command ${interaction.commandName}\nPlease check console for full details` })
            interaction.reply({ content: "An error occured when running command! The problem was reported to admins please wait for the resolution of the problem", flags: ["Ephemeral"] })
        }
    }
} as CommandObject