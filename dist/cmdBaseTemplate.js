"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js"); // Required imports
const wokcommands_1 = require("wokcommands"); // Required imports
exports.default = {
    description: "Change le mode de maintenance du bot", // Command description
    type: wokcommands_1.CommandType.SLASH, // type of command
    guildOnly: true, // always true
    permissions: [discord_js_1.PermissionFlagsBits.Administrator], // Required permissions to execute command
    ownerOnly: true,
    callback: async ({ interaction, args }) => {
        //* to execute
    }
};
