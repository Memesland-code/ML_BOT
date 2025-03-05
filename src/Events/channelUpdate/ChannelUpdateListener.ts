import { AuditLogEvent, ChannelType, EmbedBuilder, GuildChannel, TextChannel } from "discord.js"
import { client } from "../../index"
import { GetLogChannel, HandleLog } from "../../functions"
import colors from "colors"

export default async(oldChannel: GuildChannel, newChannel: GuildChannel) => {

    var guild = client!.guilds.cache.get(oldChannel.guild!.id)
    
    var guildLogsChannelID = await GetLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const AuditLogFetch = await guild?.fetchAuditLogs({limit: 1, type: AuditLogEvent.ChannelCreate});
    const Entry = AuditLogFetch?.entries.first();

    await HandleLog(colors.yellow(`EVENT\nChannel updated\n\
        `) + colors.yellow(`In server : `) + (`${newChannel.guild.name}\n\
        `) + colors.yellow(`Server ID : `) + (`${newChannel.guild.id}\n\
        `) + colors.yellow(`Channel name : `) + (`${newChannel.name}\n\
        `) + colors.yellow(`Channel ID : `) + (`${newChannel.id}\n\
        `) + colors.yellow(`Channel type : `) + (`${newChannel.type}\n\
        `) + colors.yellow(`Category name : `) + (`${newChannel.parent?.name}\n\
        `) + colors.yellow(`Category name : `) + (`${newChannel.parent?.id}\n\
        `) + colors.magenta(`User : `) + (`${Entry?.executor?.username}\n\
        `) + colors.magenta(`ID : `) + (`${Entry?.executor?.id}\n\
        `) + colors.cyan(`${new Date().toLocaleString()}\n`))

    const embed = new EmbedBuilder()
    .setAuthor({name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.displayAvatarURL()}`})
    .setTitle("A channel was updated")
    .setColor("Yellow")
    .addFields([
        {name: "Channel's infos", value: `\
        Channel : <#${newChannel.id}>\n\
        ID : ${newChannel.id}\n\
        Channel type : ${newChannel.type}\n\
        In category : ${newChannel.parent?.name}\n\
        Category ID : ${newChannel.parent?.id}`},
        {name: "Executor", value: `\
        User : <@${Entry?.executor?.id}>\n\
        ID : ${Entry?.executor?.id}`}
    ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    logsChannel.send({embeds: [embed]})
}