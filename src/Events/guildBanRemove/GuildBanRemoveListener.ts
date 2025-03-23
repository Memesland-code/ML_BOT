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
        const AuditLogFetch = await guild!.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove })
        const Entry = AuditLogFetch.entries.first()

        let executorUsername
        let executorID
        if (Entry && Entry.createdTimestamp > Date.now() - 1500) {
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

        highLogsChannel.send({ embeds: [embed] })
    } catch (error) {

        await console.log(`An error occured on VoiceStateUpdate listener\n${error}`)
        await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on VoiceStateUpdate listener\nPlease check console for full details` })
    }
}