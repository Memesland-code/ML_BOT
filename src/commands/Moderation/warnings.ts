import colors from "colors"
import { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js"
import { CommandObject, CommandType } from "wokcommands"
import { botAdmins, client } from "../.."
import { CheckTableExist, ExecuteQuery, GetHighLogChannel, HandleLog, IsBotPerformingMaintenance } from "../../functions"

export default {
  description: "Get warnings of an user",
  type: CommandType.SLASH,
  guildOnly: true,
  permissions: [PermissionFlagsBits.Administrator, PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers, PermissionFlagsBits.ModerateMembers],
  ownerOnly: false,
  options: [
    {
      name: "user",
      description: "User to get warns from",
      required: true,
      type: ApplicationCommandOptionType.User
    }
  ],

  callback: async ({ interaction, args }) => {

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

      // Get user reference from its ID
      const user = client.users.cache.get(args[0])

      // Construct embed
      const embed = new EmbedBuilder()
        .setAuthor({ name: `${user?.username}`, iconURL: `${user?.displayAvatarURL()}` })
        .setColor("Blurple")
        .setFooter({ text: `${new Date().toLocaleString()}` })

      // Get all warns
      const results = await ExecuteQuery(`SELECT * FROM WARNINGS_${interaction?.guildId} WHERE UserID = '${args[0]}';`)

      embed.setTitle(`Found ${results.length} warns`)

      for (let i = 0; i < results.length; i++) {
        embed.addFields({
          name: `Entry ${i}`, value: `\`\`\`md
          [Internal warn ID][${results[i].WarnID}]\n
          [Warned user][${client.users.cache.get(String(results[i].UserID))?.username}]
          [Warned user ID][${results[i].UserID}]\n
          [Warn date and time][${new Date(results[i].WarnDateAndTime).toLocaleString()}]\n
          [Warn Executor][${client.users.cache.get(String(results[i].WarnExecutorID))?.username}]
          [Warn executor ID][${results[i].WarnExecutorID}]\n
          [Warn reason][${results[i].WarnReason}]\n
          \`\`\``.split("\n").map(line => line.trim()).join("\n")
        })
      }

      interaction?.reply({ embeds: [embed] })
    } catch (error) {

      await HandleLog(colors.red(`An error occured when running command ${interaction.commandName}\n${error}`))
      await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on command ${interaction.commandName}\nPlease check console for full details` })
      interaction.reply({ content: "An error occured when running command! The problem was reported to admins please wait for the resolution of the problem", flags: ["Ephemeral"] })
    }
  }
} as CommandObject