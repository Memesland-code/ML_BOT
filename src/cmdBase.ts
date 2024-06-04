import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js" // Required imports
import { CommandObject, CommandType } from "wokcommands" // Required imports

export default { // Command name is file name
  description: "", // Command description
  type: CommandType.SLASH, // type of command
  guildOnly: true, // always true
  permissions: [PermissionFlagsBits.Administrator], // Required permissions to execute command
  options: [
    {
      name: "", // Discord shown name
      description: "", // Description for Discord
      required: true, // Is required
      type: ApplicationCommandOptionType.User // type of arg
    },
  ],

  callback: async ({interaction, args}) => {
    //* to execute
  }
} as CommandObject