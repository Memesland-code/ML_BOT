import { PermissionFlagsBits } from "discord.js";
import { CommandObject, CommandType } from "wokcommands"; // Required imports

export default { // Command name is file name
  description: "Change bot maintenance state", // Command description
  type: CommandType.SLASH, // type of command
  guildOnly: true, // always true
  permissions: [PermissionFlagsBits.Administrator], // Required permissions to execute command
  ownerOnly: true,

  callback: async ({ }) => {
    //* to execute
  }
} as CommandObject