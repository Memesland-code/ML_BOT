import colors from "colors"
import { AuditLogEvent, EmbedBuilder, GuildBan, TextChannel } from "discord.js"
import { GetLogChannel, HandleLog } from "../../functions"
import { client } from "../../index"

export default async (ban: GuildBan) => {

    var guild = client!.guilds.cache.get(ban.guild!.id)

    var guildLogsChannelID = await GetLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const AuditLogFetch = await guild!.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove })
    const Entry = AuditLogFetch.entries.first()

    var executorUsername
    var executorID
    if (Entry && Entry.createdTimestamp > Date.now() - 2000) {
        executorUsername = Entry.executor?.username
        executorID = Entry.executor?.id
    } else {
        executorUsername = "none"
        executorID = "none"
        HandleLog(colors.bgRed("Couldn't find any AuditLog matching MemberBanRemove the last 2 seconds!"))
    }

    await HandleLog(
        colors.red(`EVENT\nAn user ban was revoked from server\n`) +
        colors.red(`Unbanned user username : `) + colors.white(`${ban.user.username}\n`) +
        colors.red(`Unbanned user ID : `) + colors.white(`${ban.user.id}\n`) +
        colors.red(`In server : `) + colors.white(`${ban.guild.name}\n`) +
        colors.red(`Server ID : `) + colors.white(`${ban.guild.id}\n`) +
        colors.magenta(`Executor : `) + colors.white(`${executorUsername}\n`) +
        colors.magenta(`ID : `) + colors.white(`${executorID}\n`) +
        colors.cyan(`${new Date().toLocaleString()}\n`)
    )

    const embed = new EmbedBuilder()
        .setAuthor({ name: `${ban.user.username}`, iconURL: `${ban.user.displayAvatarURL()}` })
        .setTitle("User was unbanned from server")
        .setColor("DarkRed")
        .addFields([
            {
                name: "User's infos", value: `\
                User : <@${ban.user.id}>\n\
                ID : ${ban.user.id}`
            },
            {
                name: "Executor", value: `\
                User : <@${executorID}>\n\
                ID : ${executorID}`
            }
        ])
        .setFooter({ text: `${new Date().toLocaleString()}` })

    logsChannel.send({ embeds: [embed] })
}