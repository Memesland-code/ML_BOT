"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const functions_1 = require("../../functions");
const colors_1 = __importDefault(require("colors"));
const index_1 = require("../../index");
exports.default = async (oldMember, newMember) => {
    var guild = index_1.client.guilds.cache.get(oldMember.guild.id);
    var guildLogsChannelID = await (0, functions_1.getLogChannel)(guild?.id);
    var logsChannel = index_1.client.channels.cache.get(guildLogsChannelID);
    const AuditLogFetch = await guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.MemberUpdate });
    const Entry = AuditLogFetch.entries.first();
    var oldRolesList = "";
    for (let roleName of oldMember.roles.cache.toJSON()) {
        if (roleName.name === "@everyone")
            continue;
        oldRolesList += roleName.name + ", \n";
    }
    oldRolesList = oldRolesList.substring(0, oldRolesList.length - 4);
    var newRolesList = "";
    for (let roleName of newMember.roles.cache.toJSON()) {
        if (roleName.name === "@everyone")
            continue;
        newRolesList += roleName.name + ", \n";
    }
    newRolesList = newRolesList.substring(0, newRolesList.length - 4);
    console.log(colors_1.default.blue(`EVENT\nServer member updated\n\
    `) + colors_1.default.blue(`Modified user username : `) + (`${oldMember.user.username}\n\
    `) + colors_1.default.blue(`Modified user ID : `) + (`${oldMember.user.id}\n\
    `) + colors_1.default.blue(`In guild : `) + (`${oldMember.guild?.name}\n\
    `) + colors_1.default.blue(`Guild ID : `) + (`${oldMember.guild?.id}\n\
    `) + colors_1.default.blue(`Old display name : `) + (`${oldMember.nickname}\n\
    `) + colors_1.default.blue(`New display name : `) + (`${newMember.nickname}\n\
    `) + colors_1.default.blue(`Old roles list : `) + (`${oldRolesList}\n\
    `) + colors_1.default.blue(`New roles list : `) + (`${oldRolesList}\n\
    `) + colors_1.default.magenta(`Executor username : `) + (`${Entry?.executor?.id}\n\
    `) + colors_1.default.magenta(`Executor ID : `) + (`${Entry?.executor?.id}\n\
    `) + colors_1.default.gray(`Please note that if all above are the same, the guild member update performed is not supported yet\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
    const embedFieldModifiednickname = [{ name: "Modified display name", value: `Previous display name : ${oldMember.nickname}\nNew display name : ${newMember.nickname}` }];
    const embedFieldModifiedRolesList = [{ name: "Previous roles list", value: `${oldRolesList}`, inline: true }, { name: "New roles list", value: `${newRolesList}`, inline: true }];
    const enmbedFieldOtherModification = [{ name: "Warning", value: `The guild member update performed is not supported yet.\nPlease check console for full details.` }];
    const embedFieldEventExecutor = [{ name: "Executor", value: `User : <@${Entry?.executor?.id}>\nID : ${Entry?.executor?.id}` }];
    const embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `${oldMember.user.username}`, iconURL: `${oldMember.user.avatarURL()}` })
        .setTitle("An user was updated")
        .setColor("Blue");
    if (oldMember.nickname !== newMember.nickname)
        embed.addFields(embedFieldModifiednickname);
    if (oldRolesList !== newRolesList)
        embed.addFields(embedFieldModifiedRolesList);
    if (oldMember.nickname === newMember.nickname && oldRolesList === newRolesList)
        embed.addFields(enmbedFieldOtherModification);
    embed.addFields(embedFieldEventExecutor);
    logsChannel.send({ embeds: [embed] });
};
