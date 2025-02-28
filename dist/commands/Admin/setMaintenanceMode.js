"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js"); // Required imports
const wokcommands_1 = require("wokcommands"); // Required imports
const functions_1 = require("../../functions");
exports.default = {
    description: "Change bot maintenance state", // Command description
    type: wokcommands_1.CommandType.SLASH, // type of command
    guildOnly: true, // always true
    options: [
        {
            name: "maintenancestate",
            description: "état de maintenance du bot",
            required: true,
            type: discord_js_1.ApplicationCommandOptionType.Boolean
        }
    ],
    callback: async ({ interaction, args }) => {
        if (args[0] == "true") {
            (0, functions_1.executeQuery)(`UPDATE Admin SET Value = 1 WHERE KeyName = 'MaintenanceState';`);
            interaction?.reply({ content: "Le bot est maintenant en maintenance", flags: ["Ephemeral"] });
        }
        else {
            (0, functions_1.executeQuery)(`UPDATE Admin SET Value = 0 WHERE KeyName = 'MaintenanceState';`);
            interaction?.reply({ content: "Le bot n'est plus en maintenance", flags: ["Ephemeral"] });
        }
    }
};
