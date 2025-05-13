import colors from "colors"
import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js"
import { CommandObject, CommandType } from "wokcommands"
import { botAdmins, client } from "../.."
import { CheckTableExist, ExecuteQuery, GetHighLogChannel, HandleLog, IsBotPerformingMaintenance } from "../../functions"

export default {
    description: "Warn a user",
    type: CommandType.SLASH,
    guildOnly: true,
    permissions: [PermissionFlagsBits.Administrator, PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers, PermissionFlagsBits.ModerateMembers],
    ownerOnly: false,
    options: [
        {
            name: "user",
            description: "User to warn",
            required: true,
            type: ApplicationCommandOptionType.User
        },
        {
            name: "reason",
            description: "Reason of warn",
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

            if (await CheckTableExist(`WARNINGS_${interaction?.guildId}`) == false) {
                await ExecuteQuery(`CREATE TABLE WARNINGS_${interaction?.guildId} (WarnID int AUTO_INCREMENT UNIQUE, UserID VARCHAR(20), WarnDateAndTime DATETIME, WarnExecutorID BIGINT, WarnReason VARCHAR(1024));`)
            }

            const currentDateAndTime = `${new Date().getFullYear().toString()}-${(new Date().getMonth() + 1).toString()}-${new Date().getDate().toString()} ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`

            let securedReasonString = ""
            for (let i = 0; i < interaction.options.getString("reason")!.length; i++) {
                if ("\"".includes(interaction.options.getString("reason")![i])) {
                    securedReasonString += "\""
                }
                securedReasonString += interaction.options.getString("reason")![i]
            }

            const user = client.users.cache.get(String(interaction.options.getUser("user")))
            
            await HandleLog(
                colors.yellow(`Command executed\nwarn`) +
                colors.yellow(`In server : `) + colors.white(`${interaction.guild?.name}`) +
                colors.yellow(`Server ID : `) + colors.white(`${interaction.guildId}`) +
                colors.yellow(`Warned user : `) + colors.white(`${user?.username}`) +
                colors.yellow(`Warned user ID : `) + colors.white(`${user?.id}`) +
                colors.yellow(`Warn date and time : `) + colors.white(`${new Date().toLocaleString()}`) +
                colors.yellow(`Warn executor : `) + colors.white(`${interaction?.user.username}`) +
                colors.yellow(`Warn executor ID : `) + colors.white(`][${interaction?.user.id}`) +
                colors.yellow(`Warn reason : `) + colors.white(`${interaction.options.getString("reason")}`) +
                colors.cyan(`${new Date().toLocaleString()}\n`)
            )

            const embed = new EmbedBuilder()
                .setAuthor({ name: `${user?.username}`, iconURL: `${user?.avatarURL()}` })
                .setTitle("A user was warned")
                .setColor("DarkVividPink")
                .addFields({
                    name: `Entry informations`, value: `\`\`\`md
                    [Warned user][${user?.username}]
                    [Warned user ID][${user?.id}]\n
                    [Warn date and time][${new Date().toLocaleString()}]\n
                    [Warn Executor][${interaction?.user.username}]
                    [Warn executor ID][${interaction?.user.id}]\n
                    [Warn reason][${interaction.options.getString("reason")}]\n
                    \`\`\``.split("\n").map(line => line.trim()).join("\n")
                })
                .setFooter({ text: `${new Date().toLocaleString()}` })

            await ExecuteQuery(`INSERT INTO WARNINGS_${interaction?.guildId} (UserID, WarnDateAndTime, WarnExecutorID, WarnReason) VALUES ('${interaction.options.getUser("user")}', '${currentDateAndTime}', '${interaction?.user.id}', "${securedReasonString}");`)

            interaction?.reply({ content: `User <@${interaction.options.getUser("user")}> has successfully been warned with reason: "**${interaction.options.getString("reason")}**"` })
            highLogsChannel.send({ embeds: [embed] })
        } catch (error) {

            await HandleLog(colors.red(`An error occured when running command ${interaction.commandName}\n${error}`))
            await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on command ${interaction.commandName}\nPlease check console for full details` })
            interaction.reply({ content: "An error occured when running command! The problem was reported to admins please wait for the resolution of the problem", flags: ["Ephemeral"] })
        }


    }
} as CommandObject