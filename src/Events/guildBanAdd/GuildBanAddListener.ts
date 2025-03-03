import { AuditLogEvent, EmbedBuilder, GuildBan, TextChannel } from "discord.js"
import { client } from "../../index"
import { getLogChannel } from "../../functions"
import colors from "colors"

export default async(ban: GuildBan) => {

    var guild = client!.guilds.cache.get(ban.guild!.id)
    
    var guildLogsChannelID = await getLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const AuditLogFetch = await guild?.fetchAuditLogs({limit: 1, type: AuditLogEvent.MemberBanAdd})
    const Entry = AuditLogFetch?.entries.first()

    console.log(colors.red(`EVENT\nAn user ban banned from server\n\
    `) + colors.red(`Banned user username : `) + (`${ban.user.username}\n\
    `) + colors.red(`Banned user ID : `) + (`${ban.user.id}\n\
    `) + colors.red(`In server : `) + (`${ban.guild.name}\n\
    `) + colors.red(`Server ID : `) + (`${ban.guild.id}\n\
    `) + colors.red(`Reason : `) + (`${Entry?.reason}\n\
    `) + colors.magenta(`Executor : `) + (`${ban.client.user.username}\n\
    `) + colors.magenta(`ID : `) + (`${ban.client.user.id}\n\
    `) + colors.cyan(`${new Date().toLocaleString()}\n`))

    const embed = new EmbedBuilder()
    .setAuthor({name: `${ban.user.username}`, iconURL: `${ban.user.displayAvatarURL()}`})
    .setTitle("User was banned from server")
    .setColor("DarkRed")
    .addFields([
        {name: "User's infos", value: `\
        User : <@${ban.user.id}>\n\
        ID : ${ban.user.id}`},
        {name: "Reason", value: `\`\`\`fix\n${Entry?.reason}\n\`\`\``},
        {name: "Executor", value: `\
        User : <@${ban.client.user.id}>\n\
        ID : ${ban.client.user.id}`}
    ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    logsChannel.send({embeds: [embed]})
}