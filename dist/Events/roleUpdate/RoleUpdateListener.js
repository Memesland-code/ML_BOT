"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const index_1 = require("../../index");
const functions_1 = require("../../functions");
const colors_1 = __importDefault(require("colors"));
exports.default = async (oldRole, newRole) => {
    var guild = index_1.client.guilds.cache.get(oldRole.guild.id);
    var guildLogsChannelID = await (0, functions_1.getLogChannel)(guild?.id);
    var logsChannel = index_1.client.channels.cache.get(guildLogsChannelID);
    const AuditLogFetch = await guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.RoleUpdate });
    const Entry = AuditLogFetch.entries.first();
    console.log(colors_1.default.yellow(`EVENT\nA role was updated\n\
    `) + colors_1.default.yellow(`Role name : `) + (`${newRole.name}\n\
    `) + colors_1.default.yellow(`Role ID : `) + (`${newRole.id}\n\
    `) + colors_1.default.red(`In server : `) + (`${newRole.guild.name}\n\
    `) + colors_1.default.red(`Server ID : `) + (`${newRole.guild.id}\n\
    `) + colors_1.default.magenta(`Updated by user : `) + (`${Entry?.executor?.username}\n\
    `) + colors_1.default.magenta(`User ID : `) + (`${Entry?.executor?.id}\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.displayAvatarURL()}` })
        .setTitle("A role was updated")
        .setColor("Yellow")
        .addFields([
        { name: "Role infos", value: `\
        Role : <@&${newRole.id}>\n\
        ID : ${newRole.id}` },
        { name: "Executor", value: `\
        User : <@${Entry?.executor?.id}>\n\
        ID : ${Entry?.executor?.id}` }
    ])
        .setFooter({ text: `${new Date().toLocaleString()}` });
    logsChannel.send({ embeds: [embed] });
};
