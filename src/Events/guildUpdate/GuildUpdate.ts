import { AuditLogEvent, EmbedBuilder, Guild, TextChannel } from "discord.js"
import { client } from "../../index"
import { GetLogChannel, HandleLog } from "../../functions"
import colors from "colors"

export default async(oldGuild: Guild, newGuild: Guild) => {

    var guild = client!.guilds.cache.get(newGuild.id)
    
    var guildLogsChannelID = await GetLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const AuditLogFetch = await guild?.fetchAuditLogs({limit: 1, type: AuditLogEvent.GuildUpdate});
    const Entry = AuditLogFetch?.entries.first();

    await HandleLog(colors.yellow(`EVENT\nServer was updated\n\
        `) + colors.yellow(`Server : `) + (`${newGuild.name}\n\
        `) + colors.yellow(`Server ID : `) + (`${newGuild.id}\n\
        `) + colors.magenta(`Executor : `) + (`${Entry?.executor!.username}\n\
        `) + colors.magenta(`ID : `) + (`${Entry?.executor!.id}\n\
        `) + colors.cyan(`${new Date().toLocaleString()}\n`))

    const embed = new EmbedBuilder()
    .setAuthor({name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.displayAvatarURL()}`})
    .setTitle("Server was updated")
    .setColor("DarkBlue")
    .addFields([
        {name: `Executor`, value: `\
        User : <@${Entry?.executor?.id}>\n\
        ID : ${Entry?.executor?.id}`}
    ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    logsChannel.send({embeds: [embed]})
}