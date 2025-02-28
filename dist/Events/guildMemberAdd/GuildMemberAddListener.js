"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const functions_1 = require("../../functions");
const colors_1 = __importDefault(require("colors"));
const index_1 = require("../../index");
exports.default = async (member) => {
    var guild = index_1.client.guilds.cache.get(member.guild.id);
    var guildLogsChannelID = await (0, functions_1.getLogChannel)(guild?.id);
    var logsChannel = index_1.client.channels.cache.get(guildLogsChannelID);
    console.log(colors_1.default.blue(`EVENT\nNew member joined server\n\
    `) + colors_1.default.blue("User username : ") + (`${member.user.username}\n\
    `) + colors_1.default.blue("User ID : ") + (`${member.user.id}\n\
    `) + colors_1.default.blue(`In guild : `) + (`${member.guild?.name}\n\
    `) + colors_1.default.blue(`Guild ID : `) + (`${member.guild?.id}\n\
    `) + colors_1.default.blue("Server members number : ") + (`${guild?.members.cache.size}\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `${member.user.username}`, iconURL: `${member.user.avatarURL()}` })
        .setTitle("New member joined")
        .setColor("Green")
        .addFields([
        { name: "User username", value: `<@${member.user.id}>` },
        { name: "User ID", value: `${member.user.id}` },
        { name: "Account age", value: `${Math.floor((new Date().getTime() - member.user.createdAt.getTime()) / 86400000)} days` },
        { name: "Account creation date", value: `${member.user.createdAt.toLocaleString()}` },
        { name: "Server members number : ", value: `${guild?.memberCount}` }
    ])
        .setFooter({ text: `Joinded on ${new Date().toLocaleString()}` });
    logsChannel.send({ embeds: [embed] });
};
