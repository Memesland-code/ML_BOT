import { AuditLogEvent, EmbedBuilder, Role, TextChannel } from "discord.js"
import { client } from "../../index"
import { executeQuery, getLogChannel } from "../../functions"
import colors from "colors"

export default async(oldRole: Role, newRole: Role) => {
    var guild = client!.guilds.cache.get(oldRole.guild!.id)
    
    var guildLogsChannelID = await getLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const AuditLogFetch = await guild!.fetchAuditLogs({limit: 1, type: AuditLogEvent.RoleUpdate})
    const Entry = AuditLogFetch.entries.first()

    console.log(colors.yellow(`EVENT\nA role was updated\n\
    `) + colors.yellow(`Role name : `) + (`${newRole.name}\n\
    `) + colors.yellow(`Role ID : `) + (`${newRole.id}\n\
    `) + colors.magenta(`Updated by user : `) + (`${Entry?.executor?.username}\n\
    `) + colors.magenta(`User ID : `) + (`${Entry?.executor?.id}\n\
    `) + colors.cyan(`${new Date().toLocaleString()}\n`))

    const embed = new EmbedBuilder()
    .setAuthor({name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.avatarURL()}`})
    .setTitle("A role was updated")
    .setColor("Yellow")
    .addFields([
        {name: "Role infos", value: `\
        Role : <@&${newRole.id}>\n\
        ID : ${newRole.id}`},
        {name: "Executor", value: `\
        User : <@${Entry?.executor?.id}>\n\
        ID : ${Entry?.executor?.id}`}
    ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    logsChannel.send({embeds: [embed]})
}