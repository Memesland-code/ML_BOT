import colors from "colors"
import { AuditLogEvent, EmbedBuilder, GuildBan, TextChannel } from "discord.js"
import { GetHighLogChannel, HandleLog } from "../../functions"
import { botAdmins, client } from "../../index"

export default async (ban: GuildBan) => {

    let guild = client!.guilds.cache.get(ban.guild!.id)

    if (!guild) return

    let guildLogsChannelID = await GetHighLogChannel(guild?.id) as string
    let highLogsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    try {
        const AuditLogFetch = await guild?.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd })
        const Entry = AuditLogFetch?.entries.first()

        await HandleLog(
            colors.red(`EVENT\nAn user ban banned from server\n`) +
            colors.red(`Banned user username : `) + colors.white(`${ban.user.username}\n`) +
            colors.red(`Banned user ID : `) + colors.white(`${ban.user.id}\n`) +
            colors.red(`In server : `) + colors.white(`${ban.guild.name}\n`) +
            colors.red(`Server ID : `) + colors.white(`${ban.guild.id}\n`) +
            colors.red(`Reason : `) + colors.white(`${Entry?.reason}\n`) +
            colors.magenta(`Executor : `) + colors.white(`${ban.client.user.username}\n`) +
            colors.magenta(`ID : `) + colors.white(`${ban.client.user.id}\n`) +
            colors.cyan(`${new Date().toLocaleString()}\n`)
        )

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${ban.user.username}`, iconURL: `${ban.user.displayAvatarURL()}` })
            .setTitle("User was banned from server")
            .setColor("DarkRed")
            .addFields([
                {
                    name: "User's infos", value: `\
                    User : <@${ban.user.id}>\n\
                    ID : ${ban.user.id}`
                },
                { name: "Reason", value: `\`\`\`fix\n${Entry?.reason}\n\`\`\`` },
                {
                    name: "Executor", value: `\
                    User : <@${ban.client.user.id}>\n\
                    ID : ${ban.client.user.id}`
                }
            ])
            .setFooter({ text: `${new Date().toLocaleString()}` })

        highLogsChannel.send({ embeds: [embed] })
    } catch (error) {

        await HandleLog(colors.red(`An error occured on GuildBanAdd listener\n${error}`))
        await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on GuildBanAdd listener\nPlease check console for full details` })
    }
}