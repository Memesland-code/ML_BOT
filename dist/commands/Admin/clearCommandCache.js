"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wokcommands_1 = require("wokcommands"); // Required imports
var colors = require('colors');
exports.default = {
    description: "Supprime la liste des commandes enregistrées sur Discord /!\\ éteint le bot", // Command description
    type: wokcommands_1.CommandType.BOTH, // type of command
    guildOnly: true, // always true
    ownerOnly: true,
    callback: async ({ interaction }) => {
        await interaction?.client.application.commands.set([]);
        await interaction?.reply({ content: "Le cache des commandes a été effacé avec succès !\nLe bot va maintenant s'éteindre.\nVous aurez besoin de refresh Discord (CTRL + R)", flags: ['Ephemeral'] });
        console.log(colors.Red("Discord commands cache cleared successfully!\nKilling client process..."));
        await process.exit();
    }
};
