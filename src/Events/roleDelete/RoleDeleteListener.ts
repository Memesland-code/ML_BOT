import { AuditLogEvent, EmbedBuilder, Role, TextChannel } from "discord.js"
import { client } from "../../index"
import { getLogChannel } from "../../functions"
import colors from "colors"

export default async(role: Role) => {
    var guild = client!.guilds.cache.get(role.guild!.id)
    
    var guildLogsChannelID = await getLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const AuditLogFetch = await guild?.fetchAuditLogs({limit: 1, type: AuditLogEvent.RoleDelete});
    const Entry = AuditLogFetch?.entries.first();

    console.log(colors.yellow(`EVENT\nA role was deleted\n\
    `) + colors.yellow(`Role name : `) + (`${role.name}\n\
    `) + colors.yellow(`ID : `) + (`${role.id}\n\
    `) + colors.yellow(`Hex color : `) + (`${role.hexColor}\n\
    `) + colors.yellow(`Shown separated from other roles : `) + (`${role.hoist}\n\
    `) + colors.yellow(`List position : `) + (`${role.rawPosition}\n\
    `) + colors.red(`In server : `) + (`${role.guild.name}\n\
    `) + colors.red(`Server ID : `) + (`${role.guild.id}\n\
    `) + colors.magenta(`Deleted by : `) + (`${Entry?.executor?.username}\n\
    `) + colors.magenta(`ID : `) + (`${Entry?.executor?.id}\n\
    `) + colors.cyan(`${new Date().toLocaleString()}\n`))

    const embed = new EmbedBuilder()
    .setAuthor({name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.displayAvatarURL()}`})
    .setTitle("A role was deleted")
    .setColor("Red")
    .addFields([
        {name: "Roles infos", value: `\`\`\`md\n[Role name][${role.name}]\n[Role ID][${role.id}]\n[Hex color][${role.hexColor}]\n[Shown separated from other roles][${role.hoist}]\n[List position][${role.position}]\n\`\`\``},
        {name: "Role initially created on", value: `${role.createdAt.toLocaleString()}`},
        {name: "Executor", value: `\
        User : <@${Entry?.executor?.id}>\n\
        ID : ${Entry?.executor?.id}`}
    ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    logsChannel.send({embeds: [embed]})
}