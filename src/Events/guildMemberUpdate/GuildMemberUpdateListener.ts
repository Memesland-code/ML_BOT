import { APIEmbedField, AuditLogEvent, EmbedBuilder, GuildMember, TextChannel } from "discord.js";
import { getLogChannel } from "../../functions";
import colors from "colors"
import { client } from "../../index"

export default async(oldMember: GuildMember, newMember: GuildMember) => {
    var guild = client!.guilds.cache.get(oldMember.guild.id)
    
    var guildLogsChannelID = await getLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const AuditLogFetch = await guild!.fetchAuditLogs({limit: 1, type: AuditLogEvent.MemberUpdate})
    const Entry = AuditLogFetch.entries.first()

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
    

    console.log(colors.blue(`EVENT\nServer member updated\n\
    `) + colors.blue(`Modified user username : `) + (`${oldMember.user.username}\n\
    `) + colors.blue(`Modified user ID : `) + (`${oldMember.user.id}\n\
    `) + colors.blue(`Old display name : `) + (`${oldMember.nickname}\n\
    `) + colors.blue(`New display name : `) + (`${newMember.nickname}\n\
    `) + colors.blue(`Old roles list : `) + (`${oldRolesList}\n\
    `) + colors.blue(`New roles list : `) + (`${oldRolesList}\n\
    `) + colors.magenta(`Executor username : `) + (`${Entry?.executor?.id}\n\
    `) + colors.magenta(`Executor ID : `) + (`${Entry?.executor?.id}\n\
    `) + colors.gray(`Please note that if all above are the same, the guild member update performed is not supported yet\n\
    `) + colors.cyan(`${new Date().toLocaleString()}\n`))


    const embedFieldModifiednickname: APIEmbedField[] = [{name: "Modified display name", value: `Previous display name : ${oldMember.nickname}\nNew display name : ${newMember.nickname}`}]

    const embedFieldModifiedRolesList: APIEmbedField[] = [{name: "Previous roles list", value: `${oldRolesList}`, inline: true}, {name: "New roles list", value: `${newRolesList}`, inline: true}]

    const enmbedFieldOtherModification: APIEmbedField[] = [{name: "Warning", value: `The guild member update performed is not supported yet.\nPlease check console for full details.`}]

    const embedFieldEventExecutor: APIEmbedField[] = [{name: "Executor", value: `User : <@${Entry?.executor?.id}>\nID : ${Entry?.executor?.id}`}]


    const embed = new EmbedBuilder()
    .setAuthor({name: `${oldMember.user.username}`, iconURL: `${oldMember.user.avatarURL()}`})
    .setTitle("An user was updated")
    .setColor("Blue")

    if (oldMember.nickname !== newMember.nickname) embed.addFields(embedFieldModifiednickname)

    if (oldRolesList !== newRolesList) embed.addFields(embedFieldModifiedRolesList)

    if (oldMember.nickname === newMember.nickname && oldRolesList === newRolesList) embed.addFields(enmbedFieldOtherModification)

    embed.addFields(embedFieldEventExecutor)

    logsChannel.send({embeds: [embed]})
}