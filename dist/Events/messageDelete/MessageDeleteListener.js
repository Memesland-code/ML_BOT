"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const functions_1 = require("../../functions");
const colors_1 = __importDefault(require("colors"));
const index_1 = require("../../index");
exports.default = async (message) => {
    var guild = index_1.client.guilds.cache.get(message.guild.id);
    var guildLogsChannelID = await (0, functions_1.getLogChannel)(guild?.id);
    var logsChannel = index_1.client.channels.cache.get(guildLogsChannelID);
    const AuditLogFetch = await guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.MessageDelete });
    const Entry = AuditLogFetch.entries.first();
    let attachmentsLink;
    let all_attachments = [];
    if (message.attachments.size > 0) {
        message.attachments.forEach(attachment => {
            var ImageLink = attachment.proxyURL;
            all_attachments.push(ImageLink);
        });
        attachmentsLink = all_attachments;
    }
    else
        attachmentsLink = "No attachment";
    var executor;
    Entry?.executor == undefined ? executor = message.author : executor = Entry.executor;
    const messageChannel = message.channel;
    console.log(colors_1.default.blue(`EVENT\nMessage deleted\n\
    `) + colors_1.default.blue(`From user : `) + (`${message.author?.username}\n\
    `) + colors_1.default.blue(`User ID : `) + (`${message.author?.id}\n\
    `) + colors_1.default.blue(`In guild : `) + (`${message.guild?.name}\n\
    `) + colors_1.default.blue(`Guild ID : `) + (`${message.guild?.id}\n\
    `) + colors_1.default.blue(`Content : `) + (`${message.content}\n\
    `) + colors_1.default.blue(`Attachments : `) + (`${attachmentsLink}\n\
    `) + colors_1.default.blue(`Channel name : `) + (`#${messageChannel.name}\n\
    `) + colors_1.default.blue(`Channel ID : `) + (`${messageChannel.id}\n\
    `) + colors_1.default.blue(`Message initially sent on : `) + (`${message.createdAt.toLocaleString()}\n\
    `) + colors_1.default.magenta(`Executor : `) + (`${executor?.username}\n\
    `) + colors_1.default.magenta(`Executor ID : `) + (`${executor?.id}\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
    let messageContent;
    if (message.content == null) {
        messageContent = "Couldn't fetch previous message content: Discord ToS limitation";
    }
    else if (message.content.length < 900) {
        messageContent = message.content;
    }
    else
        messageContent = "Deleted message was too long to be in an embeded message. Please check the console for full details";
    var messageAuthorUsername;
    message.author == null ? messageAuthorUsername = "Unknown" : messageAuthorUsername = message.author.username;
    var messageAuthorIconURL;
    message.author == null ? messageAuthorIconURL = "https://fr.wikipedia.org/wiki/Fichier:Flat_cross_icon.svg" : messageAuthorIconURL = message.author.displayAvatarURL();
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `${messageAuthorUsername}`, iconURL: `${messageAuthorIconURL}` })
        .setTitle("Message deleted")
        .setColor("DarkGold")
        .addFields([
        { name: `Target's message infos`, value: `\n\
        User : <@${message.author?.id}> \n\
        User ID : ${message.author?.id}\n\
        Channel name : <#${messageChannel.id}>\n\
        Channel ID : ${messageChannel.id}\n` },
        { name: `Message content`, value: `\`\`\`fix\n${messageContent}\n\`\`\`` },
        { name: `Attachements`, value: `\n${attachmentsLink}\n` },
        { name: "Message initially sent on", value: `${message.createdAt.toLocaleString()}` },
        { name: `Executor`, value: `\nUser : <@${executor?.id}>\nID : ${executor?.id}\n` },
    ])
        .setFooter({ text: `${new Date().toLocaleString()}` });
    if (message.channel.id == guildLogsChannelID && message.author.id == index_1.client.user.id) {
        if (message.embeds[0] != undefined) {
            index_1.botAdmins.forEach(admin => {
                try {
                    index_1.client.users.cache.find((user) => user.id === admin)?.send({ content: `:warning: <@${admin}>!\nUser ${executor.username} tried to delete a logged message!`, embeds: [message.embeds[0]] });
                }
                catch (error) {
                    console.log(error);
                }
            });
        }
    }
    else {
        logsChannel.send({ embeds: [embed] });
    }
};
