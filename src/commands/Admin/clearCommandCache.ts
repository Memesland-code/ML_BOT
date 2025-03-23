import colors from "colors";
import { CommandObject, CommandType } from "wokcommands"; // Required imports
import { client } from "../..";
import { HandleLog } from "../../functions";

export default { // Command name is file name
  description: "Supprime la liste des commandes enregistrées sur Discord /!\\ éteint le bot", // Command description
  type: CommandType.BOTH, // type of command
  guildOnly: true, // always true
  ownerOnly: true,

  callback: async ({ interaction }) => {
    await client.application?.commands.set([])
    await interaction?.reply({ content: "Le cache des commandes a été effacé avec succès !\nLe bot va maintenant s'éteindre.\nVous aurez besoin de refresh Discord (CTRL + R)" })
    HandleLog(colors.red("Discord commands cache cleared successfully!\nKilling client process..."))
    await process.exit()
  }
} as CommandObject