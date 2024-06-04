"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js"); // Required imports
const wokcommands_1 = require("wokcommands"); // Required imports
exports.default = {
    description: "", // Command description
    type: wokcommands_1.CommandType.SLASH, // type of command
    guildOnly: true, // always true
    permissions: [discord_js_1.PermissionFlagsBits.Administrator], // Required permissions to execute command
    options: [
        {
            name: "", // Discord shown name
            description: "", // Description for Discord
            required: true, // Is required
            type: discord_js_1.ApplicationCommandOptionType.User // type of arg
        },
    ],
    callback: async ({ interaction, args }) => {
        //* to execute
    }
};
