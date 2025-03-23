import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js"
import { CommandObject, CommandType } from "wokcommands"
import { botAdmins } from "../.."
import { CheckTableExist, ExecuteQuery, IsBotPerformingMaintenance } from "../../functions"

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

  callback: async ({ interaction, args }) => {

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

    var securedReasonString = ""
    for (let i = 0; i < args[1].length; i++) {
      if ("\"".includes(args[1][i])) {
        securedReasonString += "\""
      }
      securedReasonString += args[1][i]
    }

    await ExecuteQuery(`INSERT INTO WARNINGS_${interaction?.guildId} (UserID, WarnDateAndTime, WarnExecutorID, WarnReason) VALUES ('${args[0]}', '${currentDateAndTime}', '${interaction?.user.id}', "${securedReasonString}");`)

    interaction?.reply({ content: `User <@${args[0]}> has successfully been warned with reason: "**${args[1]}**"` })
  }
} as CommandObject