"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const index_1 = require("../../index");
const functions_1 = require("../../functions");
const colors_1 = __importDefault(require("colors"));
exports.default = async (channel, time) => {
    if (channel.type != discord_js_1.ChannelType.GuildText)
        return;
    var guild = index_1.client.guilds.cache.get(channel.guild.id);
    var guildLogsChannelID = await (0, functions_1.getLogChannel)(guild?.id);
    var logsChannel = index_1.client.channels.cache.get(guildLogsChannelID);
    const AuditLogFetchPinAdd = await guild?.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.MessagePin });
    const EntryPinAdd = AuditLogFetchPinAdd?.entries.first();
    const AuditLogFetchPinRemove = await guild?.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.MessageUnpin });
    const EntryPinRemove = AuditLogFetchPinRemove?.entries.first();
    var Entry;
    var AuditLog;
    var pinMessage;
    if (AuditLogFetchPinAdd != null && EntryPinAdd != undefined && EntryPinAdd.createdTimestamp > Date.now() - 1500) {
        Entry = EntryPinAdd;
        AuditLog = AuditLogFetchPinAdd;
        pinMessage = "New message pinned";
    }
    else if (AuditLogFetchPinRemove != null && EntryPinRemove != undefined && EntryPinRemove.createdTimestamp > Date.now() - 1500) {
        Entry = EntryPinRemove;
        AuditLog = AuditLogFetchPinRemove;
        pinMessage = "Message pin was removed";
    }
    else {
        return;
    }
    var modifiedMessageID;
    await AuditLogFetchPinAdd?.entries.forEach(element => {
        modifiedMessageID = element.extra.messageId;
    });
    console.log(colors_1.default.yellow(`EVENT\n${pinMessage}\n\
    `) + colors_1.default.yellow(`In guild : `) + (`${channel.guild}\n\
    `) + colors_1.default.yellow(`Guild ID : `) + (`${channel.guild.id}\n\
    `) + colors_1.default.yellow(`In channel : `) + (`${channel.name}\n\
    `) + colors_1.default.yellow(`Channel ID : `) + (`${channel.id}\n\
    `) + colors_1.default.yellow(`In category : `) + (`${channel.parent?.name}\n\
    `) + colors_1.default.yellow(`Category ID : `) + (`${channel.parent?.id}\n\
    `) + colors_1.default.yellow(`Message ref : `) + (`https://discord.com/channels/${channel.guild.id}/${channel.id}/${modifiedMessageID}\n\
    `) + colors_1.default.magenta(`Executor username : `) + (`${Entry.executor?.username}\n\
    `) + colors_1.default.magenta(`Executor ID : `) + (`${Entry.executor?.id}\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `${Entry.executor?.username}`, iconURL: `${Entry.executor?.avatarURL()}` })
        .setTitle(`${pinMessage}`)
        .setColor("DarkAqua")
        .addFields([
        { name: `Channel infos`, value: `\
        Channel : <#${channel.id}>\n\
        ID : ${channel.id}\n\
        Category : ${channel.parent?.name}\n\
        ID : ${channel.parent?.id}` },
        { name: `Message ref`, value: `[Message](https://discord.com/channels/${channel.guild.id}/${channel.id}/${modifiedMessageID})` },
        { name: `Executor`, value: `\
        User  : <@${Entry.executor?.id}>\n\
        ID : ${Entry.executor?.id}` }
    ])
        .setFooter({ text: `${new Date().toLocaleString()}` });
    logsChannel.send({ embeds: [embed] });
};
