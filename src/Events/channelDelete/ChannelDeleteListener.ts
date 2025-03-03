import { AuditLogEvent, EmbedBuilder, GuildChannel, TextChannel } from "discord.js"
import { client } from "../../index"
import { getLogChannel } from "../../functions"
import colors from "colors"

export default async(channel: GuildChannel) => {

    var guild = client!.guilds.cache.get(channel.guild!.id)
    
    var guildLogsChannelID = await getLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const AuditLogFetch = await guild?.fetchAuditLogs({limit: 1, type: AuditLogEvent.ChannelCreate});
    const Entry = AuditLogFetch?.entries.first();

    console.log(colors.yellow(`EVENT\nChannel deleted\n\
    `) + colors.yellow(`In server : `) + (`${channel.guild.name}\n\
    `) + colors.yellow(`Server ID : `) + (`${channel.guild.id}\n\
    `) + colors.yellow(`Channel name : `) + (`${channel.name}\n\
    `) + colors.yellow(`Channel ID : `) + (`${channel.id}\n\
    `) + colors.yellow(`Channel type : `) + (`${channel.type}\n\
    `) + colors.yellow(`Category name : `) + (`${channel.parent?.name}\n\
    `) + colors.yellow(`Category ID : `) + (`${channel.parent?.id}\n\
    `) + colors.magenta(`Executor : `) + (`${Entry?.executor!.username}\n\
    `) + colors.magenta(`ID : `) + (`${Entry?.executor!.id}\n\
    `) + colors.cyan(`${new Date().toLocaleString()}\n`))

    const embed = new EmbedBuilder()
    .setAuthor({name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.displayAvatarURL()}`})
    .setTitle("Channel deleted")
    .setColor("Orange")
    .addFields([
        {name: "Channel's infos", value: `\
        Channel : <#${channel.id}>\n\
        ID : ${channel.id}\n\
        Channel type : ${channel.type}\n\
        In category : ${channel.parent?.name}\n\
        Category ID : ${channel.parent?.id}`},
        {name: "Executor", value: `\
        User : <@${Entry?.executor?.id}>\n\
        ID : ${Entry?.executor?.id}`}
    ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    logsChannel.send({embeds: [embed]})
}