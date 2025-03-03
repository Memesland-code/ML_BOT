"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const index_1 = require("../../index");
const functions_1 = require("../../functions");
const colors_1 = __importDefault(require("colors"));
exports.default = async (oldMessage, newMessage) => {
    if (oldMessage.partial)
        oldMessage = await oldMessage.fetch();
    if (newMessage.partial)
        newMessage = await newMessage.fetch();
    var guild = index_1.client.guilds.cache.get(oldMessage.guild.id);
    var guildLogsChannelID = await (0, functions_1.getLogChannel)(guild?.id);
    var logsChannel = index_1.client.channels.cache.get(guildLogsChannelID);
    let isAttachmentStillThere;
    let allAttachments = [];
    if (newMessage.attachments.size !== oldMessage.attachments.size) {
        oldMessage.attachments.forEach(attachment => {
            const ImageLink = attachment.proxyURL;
            allAttachments.push(ImageLink);
        });
        isAttachmentStillThere = allAttachments;
    }
    else
        isAttachmentStillThere = `No attachment changes`;
    let isAttachment;
    let all_attachments = [];
    if (newMessage.attachments.size > 0) {
        newMessage.attachments.forEach(attachment => {
            const ImageLink = attachment.proxyURL;
            all_attachments.push(ImageLink);
        });
        isAttachment = all_attachments;
    }
    else
        isAttachment = `No attachment`;
    const messageChannel = oldMessage.channel;
    console.log(colors_1.default.blue(`EVENT\nMessage modified\n\
    `) + colors_1.default.blue(`In guild : `) + (`${oldMessage.guild?.name}\n\
    `) + colors_1.default.blue(`Guild ID : `) + (`${oldMessage.guild?.id}\n\
    `) + colors_1.default.blue(`By : `) + (`${oldMessage.author?.username}\n\
    `) + colors_1.default.blue(`ID : `) + (`${oldMessage.author?.id}\n\
    `) + colors_1.default.blue(`Old message : `) + (`${oldMessage.content}\n\
    `) + colors_1.default.blue(`New message : `) + (`${newMessage.content}\n\
    `) + colors_1.default.blue(`Attachments if modified : `) + (`${isAttachmentStillThere}\n\
    `) + colors_1.default.blue(`Current attachments : `) + (`${isAttachment}\n\
    `) + colors_1.default.blue(`Channel name : `) + (`${messageChannel.name}\n\
    `) + colors_1.default.blue(`Channel ID : `) + (`${messageChannel.id}\n\
    `) + colors_1.default.blue(`Message initially sent : `) + (`${oldMessage.createdAt.toLocaleString()}\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
    let oldMessageContent;
    if (oldMessage.content.length < 900) {
        oldMessageContent = oldMessage.content;
    }
    else
        oldMessageContent = "Old message was too long to be in an embeded message. Please check the console for full details";
    let newMessageContent;
    if (newMessage.content.length < 900) {
        newMessageContent = newMessage.content;
    }
    else
        newMessageContent = "New message was too long to be in an embeded message. Please check the console for full details";
    if (oldMessage === newMessage)
        oldMessageContent = "Couldn't fetch previous message content: Discord ToS limitation";
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `${oldMessage.author.username}`, iconURL: `${oldMessage.author.displayAvatarURL()}` })
        .setTitle("Message modified")
        .setColor("Gold")
        .addFields([
        { name: "User's message infos", value: `\nUser : <@${oldMessage.author.id}>\nUser ID : ${oldMessage.author.id}\nChannel name : <#${messageChannel.id}>\nChannel ID : ${messageChannel.id}` },
        { name: "Old message content", value: `\`\`\`fix\n${oldMessageContent}\n\`\`\`` },
        { name: "New message content", value: `\`\`\`fix\n${newMessageContent}\n\`\`\`` },
        { name: "Old message attachments if removed", value: `${isAttachmentStillThere}` },
        { name: "Current attachments", value: `${isAttachment}` },
        { name: "Message initially sent", value: `${oldMessage.createdAt.toLocaleString()}` }
    ])
        .setFooter({ text: `${new Date().toLocaleString()}` });
    logsChannel.send({ embeds: [embed] });
};
