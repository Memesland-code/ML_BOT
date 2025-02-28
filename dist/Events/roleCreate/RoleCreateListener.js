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
    const AuditLogFetch = await guild?.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.RoleCreate });
    const Entry = AuditLogFetch?.entries.first();
    console.log(colors_1.default.yellow(`EVENT\nNew role created\n\
    `) + colors_1.default.yellow(`ID : `) + (`${role.id}\n\
    `) + colors_1.default.red(`In server : `) + (`${role.guild.name}\n\
    `) + colors_1.default.red(`Server ID : `) + (`${role.guild.id}\n\
    `) + colors_1.default.magenta(`Créé par : `) + (`${Entry?.executor?.tag}\n\
    `) + colors_1.default.magenta(`ID : `) + (`${Entry?.executor?.id}\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.avatarURL()}` })
        .setTitle("New role created")
        .setColor("DarkGreen")
        .addFields([
        { name: `Role ID`, value: `${role.id}` },
        { name: `Executor`, value: `User : <@${Entry?.executor?.id}>\nUser ID : ${Entry?.executor?.id}` }
    ])
        .setFooter({ text: `${new Date().toLocaleString()}` });
    logsChannel.send({ embeds: [embed] });
};
