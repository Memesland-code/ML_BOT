import colors from "colors";
import { APIEmbedField, AuditLogEvent, CategoryChannel, EmbedBuilder, TextChannel, User, VoiceBasedChannel, VoiceState } from "discord.js";
import { GetLogChannel, HandleLog } from "../../functions";
import { botAdmins, client } from "../../index";

export default async (oldVoiceState: VoiceState, newVoiceState: VoiceState) => {

    var guild = client!.guilds.cache.get(oldVoiceState.guild!.id)

    var guildLogsChannelID = await GetLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const AuditLogFetchMemberUpdate = await guild!.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate })
    const EntryMemberUpdate = AuditLogFetchMemberUpdate.entries.first()

    const AuditLogFetchMemberDisconnect = await guild!.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberDisconnect })
    var EntryMemberDisconnect = AuditLogFetchMemberDisconnect.entries.first()

    var Entry
    var memberUpdate
    var memberMove
    var memberDisconnect

    if (oldVoiceState.channel?.id != newVoiceState.channel?.id && newVoiceState.channel != null && oldVoiceState.channel != null) {
        Entry = EntryMemberUpdate
        memberMove = true
    } else if (oldVoiceState.channel != null && newVoiceState.channel == undefined) {
        Entry = EntryMemberDisconnect
        memberDisconnect = true
    } else {
        Entry = EntryMemberUpdate
        memberUpdate = true
    }

    const embed = new EmbedBuilder()

    if (memberMove) //* MEMBER MOVE
    {
        await HandleLog(
            colors.blue(`EVENT\nUser was moved of its voice channel\n`) +
            colors.blue(`Modified user username : `) + colors.white(`${oldVoiceState.member?.user.username}\n`) +
            colors.blue(`User ID : `) + colors.white(`${oldVoiceState.member?.user.id}\n`) +
            colors.blue(`In guild : `) + colors.white(`${oldVoiceState.guild?.name}\n`) +
            colors.blue(`Guild ID : `) + colors.white(`${oldVoiceState.guild?.id}\n`) +
            colors.blue(`Previous channel name : `) + colors.white(`${oldVoiceState.channel?.name}\n`) +
            colors.blue(`Previous channel ID : `) + (`${oldVoiceState.channel?.id}\n`) +
            colors.blue(`Previous channel users count : `) + colors.white(`${oldVoiceState.channel?.members.size}\n`) +
            colors.blue(`Previous category name : `) + colors.white(`${oldVoiceState.channel?.parent?.name}\n`) +
            colors.blue(`Previous category ID : `) + colors.white(`${oldVoiceState.channel?.parent?.id}\n`) +
            colors.blue(`New channel name : `) + colors.white(`${newVoiceState.channel?.name}\n`) +
            colors.blue(`New channel ID : `) + colors.white(`${newVoiceState.channel?.id}\n`) +
            colors.blue(`New channel users count : `) + colors.white(`${newVoiceState.channel?.members.size}\n`) +
            colors.blue(`New category name : `) + colors.white(`${newVoiceState.channel?.parent?.name}\n`) +
            colors.blue(`New category ID : `) + colors.white(`${newVoiceState.channel?.parent?.id}\n`) +
            colors.magenta(`Executor username : `) + colors.white(`${Entry?.executor?.username}\n`) +
            colors.magenta(`Executor ID : `) + colors.white(`${Entry?.executor?.id}\n`) +
            colors.cyan(`${new Date().toLocaleString()}\n`))


        embed
            .setAuthor({ name: `${oldVoiceState.member?.user.username}`, iconURL: `${oldVoiceState.member?.user.displayAvatarURL()}` })
            .setTitle("User was moved of its voice channel")
            .setColor("DarkGold")
            .addFields([
                {
                    name: "Target's infos", value: `\n\
            User : <@${oldVoiceState.member?.user.id}>\n\
            User ID : ${oldVoiceState.member?.user.id}`
                },
                {
                    name: "Previous channel infos", value: `\n\
            Name : <#${oldVoiceState.channel?.id}>\n\
            ID : ${oldVoiceState.channel?.id}\n\
            Users count : ${oldVoiceState.channel?.members.size}\n\
            Category name : ${oldVoiceState.channel?.parent?.name}\n\
            Category ID : ${oldVoiceState.channel?.parent?.id}`
                },
                {
                    name: "New channel infos", value: `\n\
            Name : <#${newVoiceState.channel?.id}>\n\
            ID : ${newVoiceState.channel?.id}\n\
            Users count : ${newVoiceState.channel?.members.size}\n\
            Category name : ${newVoiceState.channel?.parent?.name}\n\
            Category ID : ${newVoiceState.channel?.parent?.id}`
                },
                {
                    name: "Executor", value: `\n\
            User : <@${Entry.executor.id}>\n\
            ID : ${Entry.executor.id}\n`
                }
            ])
    }
    else if (memberDisconnect) //* MEMBER DISCONNECT
    {

        if (EntryMemberDisconnect?.createdTimestamp! < (Date.now() - 3000)) {

            await HandleLog(
                colors.blue(`EVENT\nUser was disconnected from voice channel\n`) +
                colors.blue(`User username : `) + colors.white(`${oldVoiceState.member?.user.username}\n`) +
                colors.blue(`User ID : `) + colors.white(`${oldVoiceState.member?.user.id}\n`) +
                colors.blue(`In guild : `) + colors.white(`${oldVoiceState.guild?.name}\n`) +
                colors.blue(`Guild ID : `) + colors.white(`${oldVoiceState.guild?.id}\n`) +
                colors.blue(`Previous channel name : `) + colors.white(`${oldVoiceState.channel?.name}\n`) +
                colors.blue(`Previous channel ID : `) + colors.white(`${oldVoiceState.channel?.id}\n`) +
                colors.blue(`Previous channel users count : `) + colors.white(`${oldVoiceState.channel?.members.size}\n`) +
                colors.blue(`Previous category name : `) + colors.white(`${oldVoiceState.channel?.parent?.name}\n`) +
                colors.blue(`Previous category ID : `) + colors.white(`${oldVoiceState.channel?.parent?.id}\n`) +
                colors.magenta(`Executor username : `) + colors.white(`${oldVoiceState.member?.user.username}\n`) +
                colors.magenta(`Executor ID : `) + colors.white(`${oldVoiceState.member?.user.id}\n`) +
                colors.cyan(`${new Date().toLocaleString()}\n`)
            )

            embed
                .setAuthor({ name: `${oldVoiceState.member?.user.username}`, iconURL: `${oldVoiceState.member?.user.displayAvatarURL()}` })
                .setTitle("User was disconnected from voice channel")
                .setColor("DarkGold")
                .addFields([
                    {
                        name: "User's infos", value: `\n\
                User : <@${oldVoiceState.member?.user.id}>\n\
                User ID : ${oldVoiceState.member?.user.id}`
                    },
                    {
                        name: "Previous channel infos", value: `\n\
                Name : <#${oldVoiceState.channel?.id}>\n\
                ID : ${oldVoiceState.channel?.id}\n\
                Users count : ${oldVoiceState.channel?.members.size}`
                    },
                    {
                        name: "Previous category infos", value: `\n\
                Name : <#${oldVoiceState.channel?.parent?.name}>\n\
                ID : ${oldVoiceState.channel?.parent?.id}`
                    },
                    {
                        name: "Executor", value: `\n\
                User : <@${oldVoiceState.member?.user.id}>\n\
                ID : ${oldVoiceState.member?.user.id}\n`
                    }
                ])
        }
        else {
            await HandleLog(
                colors.blue(`EVENT\nUser was disconnected from voice channel\n`) +
                colors.blue(`User username : `) + colors.white(`${oldVoiceState.member?.user.username}\n`) +
                colors.blue(`User ID : `) + colors.white(`${oldVoiceState.member?.user.id}\n`) +
                colors.blue(`In guild : `) + colors.white(`${oldVoiceState.guild?.name}\n`) +
                colors.blue(`Guild ID : `) + colors.white(`${oldVoiceState.guild?.id}\n`) +
                colors.blue(`Previous channel name : `) + colors.white(`${oldVoiceState.channel?.name}\n`) +
                colors.blue(`Previous channel ID : `) + colors.white(`${oldVoiceState.channel?.id}\n`) +
                colors.blue(`Previous channel users count : `) + colors.white(`${oldVoiceState.channel?.members.size}\n`) +
                colors.blue(`Previous category name : `) + colors.white(`${oldVoiceState.channel?.parent?.name}\n`) +
                colors.blue(`Previous category ID : `) + colors.white(`${oldVoiceState.channel?.parent?.id}\n`) +
                colors.magenta(`Executor username : `) + colors.white(`${EntryMemberDisconnect?.executor!.username}\n`) +
                colors.magenta(`Executor ID : `) + colors.white(`${EntryMemberDisconnect?.executor!.id}\n`) +
                colors.cyan(`${new Date().toLocaleString()}\n`)
            )

            embed
                .setAuthor({ name: `${oldVoiceState.member?.user.username}`, iconURL: `${oldVoiceState.member?.user.displayAvatarURL()}` })
                .setTitle("User was disconnected from voice channel")
                .setColor("DarkGold")
                .addFields([
                    {
                        name: "User's infos", value: `\n\
                User : <@${oldVoiceState.member?.user.id}>\n\
                User ID : ${oldVoiceState.member?.user.id}`
                    },
                    {
                        name: "Previous channel infos", value: `\n\
                Name : <#${oldVoiceState.channel?.name}>\n\
                ID : ${oldVoiceState.channel?.id}\n\
                Users count : ${oldVoiceState.channel?.members.size}`
                    },
                    {
                        name: "Previous category infos", value: `\n\
                Name : <#${oldVoiceState.channel?.parent?.name}>\n\
                ID : ${oldVoiceState.channel?.parent?.id}`
                    },
                    {
                        name: "Executor", value: `\n\
                User : <@${EntryMemberDisconnect?.executor?.id}>\n\
                ID : ${EntryMemberDisconnect?.executor?.id}\n`
                    }
                ])
        }
    }
    else if (memberUpdate) //* MEMBER UPDATE
    {
        var voiceChannelInteraction: String = ""
        var voiceChannelUser: User
        var voiceChannel: VoiceBasedChannel
        var voiceChannelCategory: CategoryChannel

        if (oldVoiceState.channel == undefined) {
            voiceChannelInteraction = "User connected to voice channel"
            voiceChannelUser = newVoiceState.member?.user!
            voiceChannel = newVoiceState.channel!
            voiceChannelCategory = newVoiceState.channel?.parent!
        } else if (newVoiceState.channel == undefined) {
            voiceChannelInteraction = "User disconnected from voice channel"
            voiceChannelUser = oldVoiceState.member?.user!
            voiceChannel = oldVoiceState.channel!
            voiceChannelCategory = oldVoiceState.channel?.parent!
        } else {
            voiceChannelInteraction = "Vocal state of user changed"
            voiceChannelUser = oldVoiceState.member?.user!
            voiceChannel = oldVoiceState.channel!
            voiceChannelCategory = oldVoiceState.channel?.parent!
        }

        await HandleLog(
            colors.blue(`EVENT\n${voiceChannelInteraction}\n`) +
            colors.blue(`Modified user : `) + colors.white(`${voiceChannelUser.username}\n`) +
            colors.blue(`User ID : `) + colors.white(`${voiceChannelUser.id}\n`) +
            colors.blue(`In guild : `) + colors.white(`${voiceChannel.guild?.name}\n`) +
            colors.blue(`Guild ID : `) + colors.white(`${voiceChannel.guild?.id}\n`) +
            colors.blue(`Channel name : `) + colors.white(`${voiceChannel.name}\n`) +
            colors.blue(`Channel ID : `) + colors.white(`${voiceChannel.id}\n`) +
            colors.blue(`Category name : `) + colors.white(`${voiceChannelCategory.name}\n`) +
            colors.blue(`Category ID : `) + colors.white(`${voiceChannelCategory.id}\n`) +
            colors.blue(`Old server muted : `) + colors.white(`${oldVoiceState.serverMute}\n`) +
            colors.blue(`New server muted : `) + colors.white(`${newVoiceState.serverMute}\n`) +
            colors.blue(`Old server deaf : `) + colors.white(`${oldVoiceState.serverDeaf}\n`) +
            colors.blue(`New server deaf : `) + colors.white(`${newVoiceState.serverDeaf}\n`) +
            colors.blue(`Old self muted : `) + colors.white(`${oldVoiceState.selfMute}\n`) +
            colors.blue(`New self muted : `) + colors.white(`${newVoiceState.selfMute}\n`) +
            colors.blue(`Old self deaf : `) + colors.white(`${oldVoiceState.selfDeaf}\n`) +
            colors.blue(`New self deaf : `) + colors.white(`${newVoiceState.selfDeaf}\n`) +
            colors.blue(`Old camera share state : `) + colors.white(`${oldVoiceState.selfVideo}\n`) +
            colors.blue(`New camera share state : `) + colors.white(`${newVoiceState.selfVideo}\n`) +
            colors.blue(`Old stream state : `) + colors.white(`${oldVoiceState.streaming}\n`) +
            colors.blue(`New stream state : `) + colors.white(`${newVoiceState.streaming}\n`) +
            colors.magenta(`Executor username : `) + colors.white(`${Entry?.executor?.username}\n`) +
            colors.magenta(`Executor ID : `) + colors.white(`${Entry?.executor?.id}\n`) +
            colors.cyan(`${new Date().toLocaleString()}\n`)
        )

        const embedFieldServerMute: APIEmbedField[] = [{ name: "Server muted?", value: `\`\`\`md\n# Old ==> ${oldVoiceState.serverMute}\n> New ==> ${newVoiceState.serverMute}\`\`\`` }]

        const embedFieldServerDeaf: APIEmbedField[] = [{ name: "Server deaf?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.serverDeaf}\n> New ==> ${newVoiceState.serverDeaf}\`\`\`` }]

        const embedFieldSelfMute: APIEmbedField[] = [{ name: "Self muted?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.selfMute}\n> New ==> ${newVoiceState.selfMute}\`\`\`` }]

        const embedFieldSelfDeaf: APIEmbedField[] = [{ name: "Self deaf?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.selfDeaf}\n> New ==> ${newVoiceState.selfDeaf}\`\`\`` }]

        const embedFieldCameraShare: APIEmbedField[] = [{ name: "Camera share?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.selfVideo}\n> New ==> ${newVoiceState.selfVideo}\`\`\`` }]

        const embedFieldStreaming: APIEmbedField[] = [{ name: "Streaming?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.streaming}\n> New ==> ${newVoiceState.streaming}\`\`\`` }]

        const embedFieldVoiceChannelUsersCount: APIEmbedField[] = [{ name: "Connected members count", value: `\`\`\`fix\n${voiceChannel.members.size}\n\`\`\`` }]

        const embedFieldEventExecutor: APIEmbedField[] = [{ name: "Executor", value: `\nUser : <@${Entry?.executor?.id}>\nID : ${Entry?.executor?.id}` }]



        embed
            .setAuthor({ name: `${voiceChannelUser.username}`, iconURL: `${voiceChannelUser.displayAvatarURL()}` })
            .setTitle(`${voiceChannelInteraction}`)
            .setColor("DarkGold")
            .addFields([
                {
                    name: "General infos", value: `\n\
            User : <@${voiceChannelUser.id}>\n\
            User ID : ${voiceChannelUser.id}\n\
            Channel name : <#${voiceChannel.id}>\n\
            Channel ID : ${voiceChannel.id}\n\
            Category name : ${voiceChannelCategory.name}\n\
            Category ID : ${voiceChannelCategory.id}`
                },
            ])
            .setFooter({ text: `${new Date().toLocaleString()}` })

        if (oldVoiceState.serverMute != newVoiceState.serverMute) embed.addFields(embedFieldServerMute)

        if (oldVoiceState.serverDeaf != newVoiceState.serverDeaf) embed.addFields(embedFieldServerDeaf)

        if (oldVoiceState.selfMute != newVoiceState.selfMute) embed.addFields(embedFieldSelfMute)

        if (oldVoiceState.selfDeaf != newVoiceState.selfDeaf) embed.addFields(embedFieldSelfDeaf)

        if (oldVoiceState.selfVideo != newVoiceState.selfVideo) embed.addFields(embedFieldCameraShare)

        if (oldVoiceState.streaming != newVoiceState.streaming) embed.addFields(embedFieldStreaming)

        embed.addFields(embedFieldVoiceChannelUsersCount)

        if (oldVoiceState.channel != undefined) embed.addFields(embedFieldEventExecutor)
    } else {
        HandleLog(colors.red(`An error occured while creating parsing the 3 possible states of VoiceUpdateListener\nError code: VSUT_LogBuildFail\nDetails: Exception Out Of Planned Bounds`)) //* VSUT_LogBuildFail
        logsChannel.send({ content: `<@${botAdmins[0]}> An error occured while parsing the 3 possible states of VoiceStateUpdateListener\nError code: VSUT_LogBuildFail\nDetails: Exception Out Of Bounds` })
        return
    }

    logsChannel.send({ embeds: [embed] })
}