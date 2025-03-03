"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const index_1 = require("../../index");
const functions_1 = require("../../functions");
const colors_1 = __importDefault(require("colors"));
exports.default = async (oldChannel, newChannel) => {
    var guild = index_1.client.guilds.cache.get(oldChannel.guild.id);
    var guildLogsChannelID = await (0, functions_1.getLogChannel)(guild?.id);
    var logsChannel = index_1.client.channels.cache.get(guildLogsChannelID);
    const AuditLogFetch = await guild?.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.ChannelCreate });
    const Entry = AuditLogFetch?.entries.first();
    console.log(colors_1.default.yellow(`EVENT\nChannel updated\n\
    `) + colors_1.default.yellow(`In server : `) + (`${newChannel.guild.name}\n\
    `) + colors_1.default.yellow(`Server ID : `) + (`${newChannel.guild.id}\n\
    `) + colors_1.default.yellow(`Channel name : `) + (`${newChannel.name}\n\
    `) + colors_1.default.yellow(`Channel ID : `) + (`${newChannel.id}\n\
    `) + colors_1.default.yellow(`Channel type : `) + (`${newChannel.type}\n\
    `) + colors_1.default.yellow(`Category name : `) + (`${newChannel.parent?.name}\n\
    `) + colors_1.default.yellow(`Category name : `) + (`${newChannel.parent?.id}\n\
    `) + colors_1.default.magenta(`User : `) + (`${Entry?.executor?.username}\n\
    `) + colors_1.default.magenta(`ID : `) + (`${Entry?.executor?.id}\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.displayAvatarURL()}` })
        .setTitle("A channel was updated")
        .setColor("Yellow")
        .addFields([
        { name: "Channel's infos", value: `\
        Channel : <#${newChannel.id}>\n\
        ID : ${newChannel.id}\n\
        Channel type : ${newChannel.type}\n\
        In category : ${newChannel.parent?.name}\n\
        Category ID : ${newChannel.parent?.id}` },
        { name: "Executor", value: `\
        User : <@${Entry?.executor?.id}>\n\
        ID : ${Entry?.executor?.id}` }
    ])
        .setFooter({ text: `${new Date().toLocaleString()}` });
    logsChannel.send({ embeds: [embed] });
};
