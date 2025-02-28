"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const index_1 = require("../../index");
const functions_1 = require("../../functions");
const colors_1 = __importDefault(require("colors"));
exports.default = async (interaction) => {
    if (interaction.context != discord_js_1.InteractionContextType.Guild)
        return;
    var guild = index_1.client.guilds.cache.get(interaction.guild.id);
    var guildLogsChannelID = await (0, functions_1.getLogChannel)(guild?.id);
    var logsChannel = index_1.client.channels.cache.get(guildLogsChannelID);
    const channel = interaction.channel;
    console.log(colors_1.default.blue(`EVENT\nInteraction created\n\
    `) + colors_1.default.blue(`In guild : `) + (`${interaction.guild?.name}\n\
    `) + colors_1.default.blue(`Guild ID : `) + (`${interaction.guild?.id}\n\
    `) + colors_1.default.blue(`By : `) + (`${interaction.user.username}\n\
    `) + colors_1.default.blue(`ID : `) + (`${interaction.user.id}\n\
    `) + colors_1.default.blue(`In channel : `) + (`${channel.name}\n\
    `) + colors_1.default.blue(`Channel ID :`) + (`${channel.id}\n\
    `) + colors_1.default.blue(`In category : `) + (`${channel.parent?.name}\n\
    `) + colors_1.default.blue(`Category ID : `) + (`${channel.parent?.id}\n\
    `) + colors_1.default.blue(`Interaction infos : `) + (`${interaction}\n`));
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.avatarURL()}` })
        .setTitle("Interaction created")
        .setColor("LightGrey")
        .addFields([
        { name: `General infos`, value: `\n\
        User : <@${interaction.user.id}>\n\
        User ID : ${interaction.user.id}\n\
        In channel : <#${channel.id}>\n\
        Channel ID : ${channel.id}\n\
        In category : ${channel.parent?.name}\n\
        Category ID : ${channel.parent?.id}` },
        { name: "Interaction infos", value: `\`\`\`fix\n${interaction}\n\`\`\`` }
    ]);
    logsChannel.send({ embeds: [embed] });
};
