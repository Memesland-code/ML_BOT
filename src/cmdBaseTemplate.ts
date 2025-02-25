import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js" // Required imports
import { CommandObject, CommandType } from "wokcommands" // Required imports

export default { // Command name is file name
  description: "Change le mode de maintenance du bot", // Command description
  type: CommandType.SLASH, // type of command
  guildOnly: true, // always true
  permissions: [PermissionFlagsBits.Administrator], // Required permissions to execute command
  ownerOnly: true,

  callback: async ({interaction, args}) => {
    //* to execute
  }
} as CommandObject