import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js"
import { CommandObject, CommandType } from "wokcommands"
import { IsBotPerformingMaintenance } from "../../functions"
import { botAdmins } from "../.."

export default {
  description: "Warn ou récupère le warn d'un membre",
  type: CommandType.SLASH,
  guildOnly: true,
  permissions: [PermissionFlagsBits.Administrator, PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers, PermissionFlagsBits.ModerateMembers],
  ownerOnly: false,
  options: [
    {
      name: "user",
      description: "User to interact",
      required: true,
      type: ApplicationCommandOptionType.User
    },
    {
      name: "reason",
      description: "Reason of warn (do not fill on warn GET!)",
      required: false,
      type: ApplicationCommandOptionType.User
    }
  ],

  callback: async ({interaction, args}) => {

    //* Basic check for bot maintenance
    let interactor:string = interaction?.user.id!
    if (await IsBotPerformingMaintenance() && !botAdmins.includes(interactor)) {
      interaction?.reply({content: "Vous ne pouvez pas effectuer de commandes pour l'instant, maintenance du bot en cours...", flags: ['Ephemeral']})
      return
    }

    //* Infos : internal warn ID ; user ID ; warn date and time ; warn reason
    //TODO : Check if argument is GET or SET
    
    //TODO (GET) : Get all the entries in DB where id = user.id
    //TODO (GET) : construct embed with infos (define max entries to show in embed) ((probably 3))
    
    //TODO (SET) : Require user ref and warn reason (else retourn ephemeral message)
    //TODO (SET) : Store data in DB following the format
  }
} as CommandObject