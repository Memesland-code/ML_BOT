import colors from "colors";
import { APIEmbedField, AuditLogEvent, EmbedBuilder, GuildMember, TextChannel } from "discord.js";
import { GetHighLogChannel, GetLogChannel, HandleLog } from "../../functions";
import { botAdmins, client } from "../../index";

export default async (oldMember: GuildMember, newMember: GuildMember) => {

    var guild = client!.guilds.cache.get(oldMember.guild.id)

    var guildHighLogsChannelID = await GetHighLogChannel(guild?.id)
    var highLogsChannel = client.channels.cache.get(guildHighLogsChannelID) as TextChannel

    try {
        var guildLogsChannelID = await GetLogChannel(guild?.id) as string
        var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

        const AuditLogFetch = await guild!.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate })
        const Entry = AuditLogFetch.entries.first()

        var executorID
        var executorUsername
        var executorUsernameFormatted

        if (Entry?.createdTimestamp! > Date.now() - 1500) {
            executorUsernameFormatted = `<@${Entry?.executor?.id}>`
            executorUsername = Entry?.executor?.username
            executorID = `${Entry?.executor?.id}`
        } else {
            executorUsernameFormatted = `Couldn't find an executor in Discord audit logs`
            executorUsername = `Couldn't find an executor in Discord audit logs`
            executorID = `Couldn't find an executor in Discord audit logs`
        }

        var oldRolesList: String = ""
        for (let roleName of oldMember.roles.cache.toJSON()) {
            if (roleName.name === "@everyone") continue
            oldRolesList += roleName.name + ", \n"
        }
        oldRolesList = oldRolesList.substring(0, oldRolesList.length - 4)

        var newRolesList: String = ""
        for (let roleName of newMember.roles.cache.toJSON()) {
            if (roleName.name === "@everyone") continue
            newRolesList += roleName.name + ", \n"
        }
        newRolesList = newRolesList.substring(0, newRolesList.length - 4)

        await HandleLog(
            colors.blue(`EVENT\nServer member updated\n`) +
            colors.blue(`Modified user username : `) + colors.white(`${oldMember.user.username}\n`) +
            colors.blue(`Modified user ID : `) + colors.white(`${oldMember.user.id}\n`) +
            colors.blue(`In guild : `) + colors.white(`${oldMember.guild?.name}\n`) +
            colors.blue(`Guild ID : `) + colors.white(`${oldMember.guild?.id}\n`) +
            colors.blue(`Old display name : `) + colors.white(`${oldMember.nickname}\n`) +
            colors.blue(`New display name : `) + colors.white(`${newMember.nickname}\n`) +
            colors.blue(`Old roles list : `) + colors.white(`${oldRolesList}\n`) +
            colors.blue(`New roles list : `) + colors.white(`${oldRolesList}\n`) +
            colors.magenta(`Executor username : `) + colors.white(`${executorUsername}\n`) +
            colors.magenta(`Executor ID : `) + colors.white(`${executorID}\n`) +
            colors.gray(`Please note that if all above are the same, the guild member update performed is not supported yet\n`) +
            colors.cyan(`${new Date().toLocaleString()}\n`)
        )

        const embedFieldModifiednickname: APIEmbedField[] = [{ name: "Modified display name", value: `Previous display name : ${oldMember.nickname}\nNew display name : ${newMember.nickname}` }]

        const embedFieldModifiedRolesList: APIEmbedField[] = [{ name: "Previous roles list", value: `${oldRolesList}`, inline: true }, { name: "New roles list", value: `${newRolesList}`, inline: true }]

        const enmbedFieldOtherModification: APIEmbedField[] = [{ name: "Warning", value: `The guild member update performed is not supported yet.\nPlease check console for full details.` }]

        const embedFieldEventExecutor: APIEmbedField[] = [{ name: "Executor", value: `User : ${executorUsernameFormatted}\nID : ${executorID}` }]


        const embed = new EmbedBuilder()
            .setAuthor({ name: `${oldMember.user.username}`, iconURL: `${oldMember.user.displayAvatarURL()}` })
            .setTitle("An user was updated")
            .setColor("Blue")

        if (oldMember.nickname !== newMember.nickname) embed.addFields(embedFieldModifiednickname)

        if (oldRolesList !== newRolesList) embed.addFields(embedFieldModifiedRolesList)

        if (oldMember.nickname === newMember.nickname && oldRolesList === newRolesList) embed.addFields(enmbedFieldOtherModification)

        embed.addFields(embedFieldEventExecutor)

        logsChannel.send({ embeds: [embed] })
    } catch (error) {

        await console.log(`An error occured on VoiceStateUpdate listener\n${error}`)
        await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on VoiceStateUpdate listener\nPlease check console for full details` })
    }
}