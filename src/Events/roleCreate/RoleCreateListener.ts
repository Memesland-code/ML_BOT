import { AuditLogEvent, EmbedBuilder, Role, TextChannel } from "discord.js"
import { client } from "../../index"
import { GetLogChannel, HandleLog } from "../../functions"
import colors from "colors"

export default async(role: Role) => {

    var guild = client!.guilds.cache.get(role.guild!.id)
    
    var guildLogsChannelID = await GetLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const AuditLogFetch = await guild?.fetchAuditLogs({limit: 1, type: AuditLogEvent.RoleCreate});
    const Entry = AuditLogFetch?.entries.first();

    await HandleLog(colors.yellow(`EVENT\nNew role created\n\
        `) + colors.yellow(`ID : `) + (`${role.id}\n\
        `) + colors.red(`In server : `) + (`${role.guild.name}\n\
        `) + colors.red(`Server ID : `) + (`${role.guild.id}\n\
        `) + colors.magenta(`Créé par : `) + (`${Entry?.executor?.tag}\n\
        `) + colors.magenta(`ID : `) + (`${Entry?.executor?.id}\n\
        `) + colors.cyan(`${new Date().toLocaleString()}\n`))

    const embed = new EmbedBuilder()
    .setAuthor({name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.displayAvatarURL()}`})
    .setTitle("New role created")
    .setColor("DarkGreen")
    .addFields([
        {name: `Role ID`, value: `${role.id}`},
        {name: `Executor`, value: `User : <@${Entry?.executor?.id}>\nUser ID : ${Entry?.executor?.id}`}
    ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    logsChannel.send({embeds: [embed]})
}