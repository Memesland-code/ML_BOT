import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js" // Required imports
import { CommandObject, CommandType } from "wokcommands" // Required imports
var colors = require('colors')

export default { // Command name is file name
  description: "Supprime la liste des commandes enregistrées sur Discord /!\\ éteint le bot", // Command description
  type: CommandType.SLASH, // type of command
  guildOnly: true, // always true
  permissions: [PermissionFlagsBits.Administrator], // Required permissions to execute command

  callback: async ({interaction}) => {
    await interaction?.client.application.commands.set([])
    await interaction?.reply({content: "Le cache des commandes a été effacé avec succès !\nLe bot va maintenant s'éteindre.\nVous aurez besoin de refresh Discord (CTRL + R)", ephemeral: true})
    console.log(colors.Red("Discord commands cache cleared successfully!\nKilling client process..."))
    await process.exit()
  }
} as CommandObject