"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const index_1 = require("../../index");
const functions_1 = require("../../functions");
const colors_1 = __importDefault(require("colors"));
exports.default = async (role) => {
    var guild = index_1.client.guilds.cache.get(role.guild.id);
    var guildLogsChannelID = await (0, functions_1.getLogChannel)(guild?.id);
    var logsChannel = index_1.client.channels.cache.get(guildLogsChannelID);
    const AuditLogFetch = await guild?.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.RoleDelete });
    const Entry = AuditLogFetch?.entries.first();
    console.log(colors_1.default.yellow(`EVENT\nA role was deleted\n\
    `) + colors_1.default.yellow(`Role name : `) + (`${role.name}\n\
    `) + colors_1.default.yellow(`ID : `) + (`${role.id}\n\
    `) + colors_1.default.yellow(`Hex color : `) + (`${role.hexColor}\n\
    `) + colors_1.default.yellow(`Shown separated from other roles : `) + (`${role.hoist}\n\
    `) + colors_1.default.yellow(`List position : `) + (`${role.rawPosition}\n\
    `) + colors_1.default.red(`In server : `) + (`${role.guild.name}\n\
    `) + colors_1.default.red(`Server ID : `) + (`${role.guild.id}\n\
    `) + colors_1.default.magenta(`Deleted by : `) + (`${Entry?.executor?.username}\n\
    `) + colors_1.default.magenta(`ID : `) + (`${Entry?.executor?.id}\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.displayAvatarURL()}` })
        .setTitle("A role was deleted")
        .setColor("Red")
        .addFields([
        { name: "Roles infos", value: `\`\`\`md\n[Role name][${role.name}]\n[Role ID][${role.id}]\n[Hex color][${role.hexColor}]\n[Shown separated from other roles][${role.hoist}]\n[List position][${role.position}]\n\`\`\`` },
        { name: "Role initially created on", value: `${role.createdAt.toLocaleString()}` },
        { name: "Executor", value: `\
        User : <@${Entry?.executor?.id}>\n\
        ID : ${Entry?.executor?.id}` }
    ])
        .setFooter({ text: `${new Date().toLocaleString()}` });
    logsChannel.send({ embeds: [embed] });
};
