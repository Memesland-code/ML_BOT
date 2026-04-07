import colors from "colors";
import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits, TextChannel, User } from "discord.js";
import { CommandObject, CommandType } from "wokcommands"; // Required imports
import { botAdmins, client } from "../..";
import { GetHighLogChannel, HandleLog, IsBotPerformingMaintenance } from "../../utils/functions";

// Help : https://discord.com/developers/docs/interactions/application-commands#subcommands-and-subcommand-groups

export default { // Command name is file name
    description: "Change le mode de maintenance du bot", // Command description
    type: CommandType.SLASH, // type of command
    guildOnly: true, // always true
    permissions: [PermissionFlagsBits.ManageChannels], // Required permissions to execute command
    ownerOnly: false,
    options: [
        {
            name: "messages",
            description: "Deletes a set number of messages in current channel (can filter user)",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "number",
                    description: "Number of messages to delete",
                    required: true,
                    type: ApplicationCommandOptionType.Number
                },
                {
                    name: "user",
                    description: "Filter message delete with an user",
                    required: false,
                    type: ApplicationCommandOptionType.User,
                    default: ""
                }
            ]
        },
        {
            name: "last",
            description: "Deletes all messages sent in the given time (can filter user)",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "time",
                    description: "Amount of time to take in account",
                    required: true,
                    type: ApplicationCommandOptionType.String
                },
                {
                    name: "user",
                    description: "Filter message delete with an user",
                    required: false,
                    type: ApplicationCommandOptionType.User,
                    default: ""
                }
            ]
        },
        {
            name: "after",
            description: "Deletes all messages sent after the given message (can filter user)",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "messageid",
                    description: "The ID of the message you want to delete messages from",
                    required: true,
                    type: ApplicationCommandOptionType.Number
                },
                {
                    name: "user",
                    description: "Filter message delete with an user",
                    required: false,
                    type: ApplicationCommandOptionType.User,
                    default: ""
                }
            ]
        },
        {
            name: "global",
            description: "Deletes messages from an user in all channels in a given time",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    description: "The user to delete messages from",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                },
                {
                    name: "time",
                    description: "Amount of time to take in account",
                    required: true,
                    type: ApplicationCommandOptionType.String
                }
            ]
        }
    ],

    callback: async ({ interaction }) => {

        if (!interaction) return
        let guild = interaction.guildId

        let guildLogsChannelID = await GetHighLogChannel(guild as string)
        let highLogsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

        try {
            //* Basic check for bot maintenance
            let interactor: string = interaction?.user.id!
            if (await IsBotPerformingMaintenance() && !botAdmins.includes(interactor)) {
                interaction?.reply({ content: "Vous ne pouvez pas effectuer de commandes pour l'instant, maintenance du bot en cours...", flags: ['Ephemeral'] })
                return
            }

            if (interaction.options.getSubcommand() === "message") {
                const ch = interaction?.channel as TextChannel
                var currentDeletedMessages = 0
                var finalDeletedMessages

                if (interaction.options.getUser("user")?.username === "") { // if user is null, deletes all messages without checking
                    ch.bulkDelete(Number(interaction.options.getNumber("number")), true)
                    finalDeletedMessages = interaction.options.getNumber("number")
                } else {
                    for (let i = 0; i < ch.messages.cache.size; i++) { // for each message in channel
                        if (currentDeletedMessages >= Number(interaction.options.getNumber("number"))) break
                        var msg = ch.messages.cache.at(i)
                        if (msg?.author == interaction.options.getUser("user") as unknown as User) {
                            if (!msg?.deletable) break // stops if message can't be deleted
                            msg?.delete() // Delete the message if the referenced user is the author
                            currentDeletedMessages++
                        }
                    }
                    finalDeletedMessages = currentDeletedMessages
                }

                await HandleLog(
                    colors.yellow(`Command executed\npurgeMessages`) +
                    colors.yellow(`In server : `) + colors.white(`${interaction.guild?.name}`) +
                    colors.yellow(`Server ID : `) + colors.white(`${interaction.guild?.id}`) +
                    colors.yellow(`In channel : `) + colors.white(`${ch.name}`) +
                    colors.yellow(`Channel ID : `) + colors.white(`${ch.id}`) +
                    colors.yellow(`Number of messages deleted : `) + colors.white(`${finalDeletedMessages}`) +
                    colors.yellow(`Executor username : `) + colors.white(`${interaction.user.username}`) +
                    colors.yellow(`Executor ID : `) + colors.white(`${interaction.user.id}`) +
                    colors.cyan(`${new Date().toLocaleString()}\n`)
                )

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}` })
                    .setTitle("Messages deleted")
                    .setColor("Orange")
                    .addFields(
                        {
                            name: `Command`, value: `\
                        Name: ${interaction.commandName}\n\
                        Number of messages to delete: ${finalDeletedMessages}`
                        },
                        {
                            name: `Executor`, value: `\
                        User : <@${interaction.user.id}>\n\
                        ID : ${interaction.user.id}`
                        }
                    )
                    .setFooter({ text: `${new Date().toLocaleString()}` })

                interaction.reply({ content: `${interaction.options.getNumber("number")} messages have successfully been deleted!` })
                highLogsChannel.send({ embeds: [embed] })
            }
        } catch (error) {

            await HandleLog(colors.red(`An error occured when running command ${interaction.commandName}\n${error}`))
            await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on command ${interaction.commandName}\nPlease check console for full details` })
            interaction.reply({ content: "An error occured when running command! The problem was reported to admins please wait for the resolution of the problem", flags: ["Ephemeral"] })
        }

    }
} as CommandObject