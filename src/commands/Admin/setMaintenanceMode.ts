import { ApplicationCommandOptionType } from "discord.js";
import { CommandObject, CommandType } from "wokcommands"; // Required imports
import { ExecuteQuery } from "../../functions";
import { setClientActivity } from "../..";

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

  callback: async ({ interaction }) => {

    if (interaction?.options.getBoolean("maintenancestate") == true) {
      ExecuteQuery(`UPDATE Admin SET Value = 1 WHERE KeyName = 'MaintenanceState';`)
      interaction?.reply({ content: "Le bot est maintenant en maintenance", flags: ["Ephemeral"] })
      setClientActivity(true)

    } else {
      
      ExecuteQuery(`UPDATE Admin SET Value = 0 WHERE KeyName = 'MaintenanceState';`)
      interaction?.reply({ content: "Le bot n'est plus en maintenance", flags: ["Ephemeral"] })
      setClientActivity(false)
    }
  }
} as CommandObject