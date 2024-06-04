"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js"); // Required imports
const wokcommands_1 = require("wokcommands"); // Required imports
var colors = require('colors');
exports.default = {
    description: "Supprime la liste des commandes enregistrées sur Discord /!\\ éteint le bot", // Command description
    type: wokcommands_1.CommandType.SLASH, // type of command
    guildOnly: true, // always true
    permissions: [discord_js_1.PermissionFlagsBits.Administrator], // Required permissions to execute command
    callback: async ({ interaction }) => {
        await interaction?.client.application.commands.set([]);
        await interaction?.reply({ content: "Le cache des commandes a été effacé avec succès !\nLe bot va maintenant s'éteindre.\nVous aurez besoin de refresh Discord (CTRL + R)", ephemeral: true });
        console.log(colors.Red("Discord commands cache cleared successfully!\nKilling client process..."));
        await process.exit();
    }
};
