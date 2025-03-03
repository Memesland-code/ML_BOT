"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const index_1 = require("../../index");
const functions_1 = require("../../functions");
const colors_1 = __importDefault(require("colors"));
exports.default = async (ban) => {
    var guild = index_1.client.guilds.cache.get(ban.guild.id);
    var guildLogsChannelID = await (0, functions_1.getLogChannel)(guild?.id);
    var logsChannel = index_1.client.channels.cache.get(guildLogsChannelID);
    const AuditLogFetch = await guild?.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.MemberBanAdd });
    const Entry = AuditLogFetch?.entries.first();
    console.log(colors_1.default.red(`EVENT\nAn user ban banned from server\n\
    `) + colors_1.default.red(`Banned user username : `) + (`${ban.user.username}\n\
    `) + colors_1.default.red(`Banned user ID : `) + (`${ban.user.id}\n\
    `) + colors_1.default.red(`In server : `) + (`${ban.guild.name}\n\
    `) + colors_1.default.red(`Server ID : `) + (`${ban.guild.id}\n\
    `) + colors_1.default.red(`Reason : `) + (`${Entry?.reason}\n\
    `) + colors_1.default.magenta(`Executor : `) + (`${ban.client.user.username}\n\
    `) + colors_1.default.magenta(`ID : `) + (`${ban.client.user.id}\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `${ban.user.username}`, iconURL: `${ban.user.displayAvatarURL()}` })
        .setTitle("User was banned from server")
        .setColor("DarkRed")
        .addFields([
        { name: "User's infos", value: `\
        User : <@${ban.user.id}>\n\
        ID : ${ban.user.id}` },
        { name: "Reason", value: `\`\`\`fix\n${Entry?.reason}\n\`\`\`` },
        { name: "Executor", value: `\
        User : <@${ban.client.user.id}>\n\
        ID : ${ban.client.user.id}` }
    ])
        .setFooter({ text: `${new Date().toLocaleString()}` });
    logsChannel.send({ embeds: [embed] });
};
