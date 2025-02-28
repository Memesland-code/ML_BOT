"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const index_1 = require("../../index");
const functions_1 = require("../../functions");
const colors_1 = __importDefault(require("colors"));
exports.default = async (channel) => {
    var guild = index_1.client.guilds.cache.get(channel.guild.id);
    var guildLogsChannelID = await (0, functions_1.getLogChannel)(guild?.id);
    var logsChannel = index_1.client.channels.cache.get(guildLogsChannelID);
    const AuditLogFetch = await guild?.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.ChannelCreate });
    const Entry = AuditLogFetch?.entries.first();
    console.log(colors_1.default.yellow(`EVENT\nChannel deleted\n\
    `) + colors_1.default.yellow(`In server : `) + (`${channel.guild.name}\n\
    `) + colors_1.default.yellow(`Server ID : `) + (`${channel.guild.id}\n\
    `) + colors_1.default.yellow(`Channel name : `) + (`${channel.name}\n\
    `) + colors_1.default.yellow(`Channel ID : `) + (`${channel.id}\n\
    `) + colors_1.default.yellow(`Channel type : `) + (`${channel.type}\n\
    `) + colors_1.default.yellow(`Category name : `) + (`${channel.parent?.name}\n\
    `) + colors_1.default.yellow(`Category ID : `) + (`${channel.parent?.id}\n\
    `) + colors_1.default.magenta(`Executor : `) + (`${Entry?.executor.username}\n\
    `) + colors_1.default.magenta(`ID : `) + (`${Entry?.executor.id}\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.avatarURL()}` })
        .setTitle("Channel deleted")
        .setColor("Orange")
        .addFields([
        { name: "Channel's infos", value: `\
        Channel : <#${channel.id}>\n\
        ID : ${channel.id}\n\
        Channel type : ${channel.type}\n\
        In category : ${channel.parent?.name}\n\
        Category ID : ${channel.parent?.id}` },
        { name: "Executor", value: `\
        User : <@${Entry?.executor?.id}>\n\
        ID : ${Entry?.executor?.id}` }
    ])
        .setFooter({ text: `${new Date().toLocaleString()}` });
    logsChannel.send({ embeds: [embed] });
};
