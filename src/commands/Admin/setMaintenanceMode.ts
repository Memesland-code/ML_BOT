import { ApplicationCommandOptionType } from "discord.js";
import { CommandObject, CommandType } from "wokcommands"; // Required imports
import { ExecuteQuery } from "../../functions";

export default { // Command name is file name
  description: "Change bot maintenance state", // Command description
  type: CommandType.SLASH, // type of command
  guildOnly: true, // always true

  options: [
    {
      name: "maintenancestate",
      description: "état de maintenance du bot",
      required: true,
      type: ApplicationCommandOptionType.Boolean
    }
  ],

  callback: async ({ interaction, args }) => {
    if (args[0] == "true") {
      ExecuteQuery(`UPDATE Admin SET Value = 1 WHERE KeyName = 'MaintenanceState';`)
      interaction?.reply({ content: "Le bot est maintenant en maintenance", flags: ["Ephemeral"] })
    } else {
      ExecuteQuery(`UPDATE Admin SET Value = 0 WHERE KeyName = 'MaintenanceState';`)
      interaction?.reply({ content: "Le bot n'est plus en maintenance", flags: ["Ephemeral"] })
    }
  }
} as CommandObject