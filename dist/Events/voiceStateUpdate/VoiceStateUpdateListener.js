"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const index_1 = require("../../index");
const functions_1 = require("../../functions");
const colors_1 = __importDefault(require("colors"));
exports.default = async (oldVoiceState, newVoiceState) => {
    var guild = index_1.client.guilds.cache.get(oldVoiceState.guild.id);
    var guildLogsChannelID = await (0, functions_1.getLogChannel)(guild?.id);
    var logsChannel = index_1.client.channels.cache.get(guildLogsChannelID);
    const AuditLogFetchMemberUpdate = await guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.MemberUpdate });
    const EntryMemberUpdate = AuditLogFetchMemberUpdate.entries.first();
    const AuditLogFetchMemberDisconnect = await guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.MemberDisconnect });
    const EntryMemberDisconnect = AuditLogFetchMemberDisconnect.entries.first();
    var Entry;
    var memberUpdate;
    var memberMove;
    var memberDisconnect;
    if (oldVoiceState.channel?.id != newVoiceState.channel?.id && newVoiceState.channel != null && oldVoiceState.channel != null) {
        Entry = EntryMemberUpdate;
        memberMove = true;
    }
    else if (oldVoiceState.channel != null && newVoiceState.channel == undefined) {
        Entry = EntryMemberUpdate;
        memberDisconnect = true;
    }
    else {
        Entry = EntryMemberUpdate;
        memberUpdate = true;
    }
    const embed = new discord_js_1.EmbedBuilder();
    if (memberMove) {
        console.log(colors_1.default.blue(`EVENT\nUser was moved of its voice channel\n\
    `) + colors_1.default.blue(`Modified user username : `) + (`${oldVoiceState.member?.user.username}\n\
    `) + colors_1.default.blue(`User ID : `) + (`${oldVoiceState.member?.user.id}\n\
    `) + colors_1.default.blue(`In guild : `) + (`${oldVoiceState.guild?.name}\n\
    `) + colors_1.default.blue(`Guild ID : `) + (`${oldVoiceState.guild?.id}\n\
    `) + colors_1.default.blue(`Previous channel name : `) + (`${oldVoiceState.channel?.name}\n\
    `) + colors_1.default.blue(`Previous channel ID : `) + (`${oldVoiceState.channel?.id}\n\
    `) + colors_1.default.blue(`Previous channel users count : `) + (`${oldVoiceState.channel?.members.size}\n\
    `) + colors_1.default.blue(`Previous category name : `) + (`${oldVoiceState.channel?.parent?.name}\n\
    `) + colors_1.default.blue(`Previous category ID : `) + (`${oldVoiceState.channel?.parent?.id}\n\
    `) + colors_1.default.blue(`New channel name : `) + (`${newVoiceState.channel?.name}\n\
    `) + colors_1.default.blue(`New channel ID : `) + (`${newVoiceState.channel?.id}\n\
    `) + colors_1.default.blue(`New channel users count : `) + (`${newVoiceState.channel?.members.size}\n\
    `) + colors_1.default.blue(`New category name : `) + (`${newVoiceState.channel?.parent?.name}\n\
    `) + colors_1.default.blue(`New category ID : `) + (`${newVoiceState.channel?.parent?.id}\n\
    `) + colors_1.default.magenta(`Executor username : `) + (`${Entry?.executor?.username}\n\
    `) + colors_1.default.magenta(`Executor ID : `) + (`${Entry?.executor?.id}\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
        embed
            .setAuthor({ name: `${oldVoiceState.member?.user.username}`, iconURL: `${oldVoiceState.member?.user.displayAvatarURL()}` })
            .setTitle("User was moved of its voice channel")
            .setColor("DarkGold")
            .addFields([
            { name: "Target's infos", value: `\n\
            User : <@${oldVoiceState.member?.user.id}>\n\
            User ID : ${oldVoiceState.member?.user.id}` },
            { name: "Previous channel infos", value: `\n\
            Name : <#${oldVoiceState.channel?.id}>\n\
            ID : ${oldVoiceState.channel?.id}\n\
            Users count : ${oldVoiceState.channel?.members.size}\n\
            Category name : ${oldVoiceState.channel?.parent?.name}\n\
            Category ID : ${oldVoiceState.channel?.parent?.id}` },
            { name: "New channel infos", value: `\n\
            Name : <#${newVoiceState.channel?.id}>\n\
            ID : ${newVoiceState.channel?.id}\n\
            Users count : ${newVoiceState.channel?.members.size}\n\
            Category name : ${newVoiceState.channel?.parent?.name}\n\
            Category ID : ${newVoiceState.channel?.parent?.id}` },
            { name: "Executor", value: `\n\
            User : <@${Entry.executor.id}>\n\
            ID : ${Entry.executor.id}\n` }
        ]);
    }
    else if (memberDisconnect) {
        console.log(colors_1.default.blue(`EVENT\nUser was disconnected from voice channel\n\
    `) + colors_1.default.blue(`User username : `) + (`${oldVoiceState.member?.user.username}\n\
    `) + colors_1.default.blue(`User ID : `) + (`${oldVoiceState.member?.user.id}\n\
    `) + colors_1.default.blue(`In guild : `) + (`${oldVoiceState.guild?.name}\n\
    `) + colors_1.default.blue(`Guild ID : `) + (`${oldVoiceState.guild?.id}\n\
    `) + colors_1.default.blue(`Previous channel name : `) + (`${oldVoiceState.channel?.name}\n\
    `) + colors_1.default.blue(`Previous channel ID : `) + (`${oldVoiceState.channel?.id}\n\
    `) + colors_1.default.blue(`Previous channel users count : `) + (`${oldVoiceState.channel?.members.size}\n\
    `) + colors_1.default.blue(`Previous category name : `) + (`${oldVoiceState.channel?.parent?.name}\n\
    `) + colors_1.default.blue(`Previous category ID : `) + (`${oldVoiceState.channel?.parent?.id}\n\
    `) + colors_1.default.magenta(`Executor username : `) + (`${EntryMemberDisconnect?.executor?.username}\n\
    `) + colors_1.default.magenta(`Executor ID : `) + (`${EntryMemberDisconnect?.executor?.id}\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
        embed
            .setAuthor({ name: `${oldVoiceState.member?.user.username}`, iconURL: `${oldVoiceState.member?.user.displayAvatarURL()}` })
            .setTitle("User was disconnected from voice channel")
            .setColor("DarkGold")
            .addFields([
            { name: "User's infos", value: `\n\
            User : <@${oldVoiceState.member?.user.id}>\n\
            User ID : ${oldVoiceState.member?.user.id}` },
            { name: "Previous channel infos", value: `\n\
            Name : <#${oldVoiceState.channel?.id}>\n\
            ID : ${oldVoiceState.channel?.id}\n\
            Users count : ${oldVoiceState.channel?.members.size}` },
            { name: "Previous category infos", value: `\n\
            Name : <#${oldVoiceState.channel?.parent?.name}>\n\
            ID : ${oldVoiceState.channel?.parent?.id}` },
            { name: "Executor", value: `\n\
            User : <@${EntryMemberDisconnect?.executor?.id}>\n\
            ID : ${EntryMemberDisconnect?.executor?.id}\n` }
        ]);
    }
    else if (memberUpdate) {
        var voiceChannelInteraction = "";
        var voiceChannelUser;
        var voiceChannel;
        var voiceChannelCategory;
        if (oldVoiceState.channel == undefined) {
            voiceChannelInteraction = "User connected to voice channel";
            voiceChannelUser = newVoiceState.member?.user;
            voiceChannel = newVoiceState.channel;
            voiceChannelCategory = newVoiceState.channel?.parent;
        }
        else if (newVoiceState.channel == undefined) {
            voiceChannelInteraction = "User disconnected from voice channel";
            voiceChannelUser = oldVoiceState.member?.user;
            voiceChannel = oldVoiceState.channel;
            voiceChannelCategory = oldVoiceState.channel?.parent;
        }
        else {
            voiceChannelInteraction = "Vocal state of user changed";
            voiceChannelUser = oldVoiceState.member?.user;
            voiceChannel = oldVoiceState.channel;
            voiceChannelCategory = oldVoiceState.channel?.parent;
        }
        console.log(colors_1.default.blue(`EVENT\n${voiceChannelInteraction}\n\
    `) + colors_1.default.blue(`Modified user : `) + (`${voiceChannelUser.username}\n\
    `) + colors_1.default.blue(`User ID : `) + (`${voiceChannelUser.id}\n\
    `) + colors_1.default.blue(`In guild : `) + (`${voiceChannel.guild?.name}\n\
    `) + colors_1.default.blue(`Guild ID : `) + (`${voiceChannel.guild?.id}\n\
    `) + colors_1.default.blue(`Channel name : `) + (`${voiceChannel.name}\n\
    `) + colors_1.default.blue(`Channel ID : `) + (`${voiceChannel.id}\n\
    `) + colors_1.default.blue(`Category name : `) + (`${voiceChannelCategory.name}\n\
    `) + colors_1.default.blue(`Category ID : `) + (`${voiceChannelCategory.id}\n\
    `) + colors_1.default.blue(`Old server muted : `) + (`${oldVoiceState.serverMute}\n\
    `) + colors_1.default.blue(`New server muted : `) + (`${newVoiceState.serverMute}\n\
    `) + colors_1.default.blue(`Old server deaf : `) + (`${oldVoiceState.serverDeaf}\n\
    `) + colors_1.default.blue(`New server deaf : `) + (`${newVoiceState.serverDeaf}\n\
    `) + colors_1.default.blue(`Old self muted : `) + (`${oldVoiceState.selfMute}\n\
    `) + colors_1.default.blue(`New self muted : `) + (`${newVoiceState.selfMute}\n\
    `) + colors_1.default.blue(`Old self deaf : `) + (`${oldVoiceState.selfDeaf}\n\
    `) + colors_1.default.blue(`New self deaf : `) + (`${newVoiceState.selfDeaf}\n\
    `) + colors_1.default.blue(`Old camera share state : `) + (`${oldVoiceState.selfVideo}\n\
    `) + colors_1.default.blue(`New camera share state : `) + (`${newVoiceState.selfVideo}\n\
    `) + colors_1.default.blue(`Old stream state : `) + (`${oldVoiceState.streaming}\n\
    `) + colors_1.default.blue(`New stream state : `) + (`${newVoiceState.streaming}\n\
    `) + colors_1.default.magenta(`Executor username : `) + (`${Entry?.executor?.username}\n\
    `) + colors_1.default.magenta(`Executor ID : `) + (`${Entry?.executor?.id}\n\
    `) + colors_1.default.cyan(`${new Date().toLocaleString()}\n`));
        const embedFieldServerMute = [{ name: "Server muted?", value: `\`\`\`md\n# Old ==> ${oldVoiceState.serverMute}\n> New ==> ${newVoiceState.serverMute}\`\`\`` }];
        const embedFieldServerDeaf = [{ name: "Server deaf?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.serverDeaf}\n> New ==> ${newVoiceState.serverDeaf}\`\`\`` }];
        const embedFieldSelfMute = [{ name: "Self muted?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.selfMute}\n> New ==> ${newVoiceState.selfMute}\`\`\`` }];
        const embedFieldSelfDeaf = [{ name: "Self deaf?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.selfDeaf}\n> New ==> ${newVoiceState.selfDeaf}\`\`\`` }];
        const embedFieldCameraShare = [{ name: "Camera share?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.selfVideo}\n> New ==> ${newVoiceState.selfVideo}\`\`\`` }];
        const embedFieldStreaming = [{ name: "Streaming?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.streaming}\n> New ==> ${newVoiceState.streaming}\`\`\`` }];
        const embedFieldVoiceChannelUsersCount = [{ name: "Connected members count", value: `\`\`\`fix\n${voiceChannel.members.size}\n\`\`\`` }];
        const embedFieldEventExecutor = [{ name: "Executor", value: `\nUser : <@${Entry?.executor?.id}>\nID : ${Entry?.executor?.id}` }];
        embed
            .setAuthor({ name: `${voiceChannelUser.username}`, iconURL: `${voiceChannelUser.displayAvatarURL()}` })
            .setTitle(`${voiceChannelInteraction}`)
            .setColor("DarkGold")
            .addFields([
            { name: "General infos", value: `\n\
            User : <@${voiceChannelUser.id}>\n\
            User ID : ${voiceChannelUser.id}\n\
            Channel name : <#${voiceChannel.id}>\n\
            Channel ID : ${voiceChannel.id}\n\
            Category name : ${voiceChannelCategory.name}\n\
            Category ID : ${voiceChannelCategory.id}` },
        ])
            .setFooter({ text: `${new Date().toLocaleString()}` });
        if (oldVoiceState.serverMute != newVoiceState.serverMute)
            embed.addFields(embedFieldServerMute);
        if (oldVoiceState.serverDeaf != newVoiceState.serverDeaf)
            embed.addFields(embedFieldServerDeaf);
        if (oldVoiceState.selfMute != newVoiceState.selfMute)
            embed.addFields(embedFieldSelfMute);
        if (oldVoiceState.selfDeaf != newVoiceState.selfDeaf)
            embed.addFields(embedFieldSelfDeaf);
        if (oldVoiceState.selfVideo != newVoiceState.selfVideo)
            embed.addFields(embedFieldCameraShare);
        if (oldVoiceState.streaming != newVoiceState.streaming)
            embed.addFields(embedFieldStreaming);
        embed.addFields(embedFieldVoiceChannelUsersCount);
        embed.addFields(embedFieldEventExecutor);
    }
    else {
        console.error(colors_1.default.red(`An error occured while creating parsing the 3 possible states of VoiceUpdateListener\nError code: VSUT_LogBuildFail\nDetails: Exception Out Of Planned Bounds`)); //* VSUT_LogBuildFail
        logsChannel.send({ content: `<@${index_1.botAdmins[0]}> An error occured while parsing the 3 possible states of VoiceStateUpdateListener\nError code: VSUT_LogBuildFail\nDetails: Exception Out Of Planned Bounds` });
        return;
    }
    logsChannel.send({ embeds: [embed] });
};
