import colors from "colors"
import { AuditLogEvent, EmbedBuilder, Role, TextChannel } from "discord.js"
import { GetHighLogChannel, GetLogChannel, HandleLog } from "../../functions"
import { botAdmins, client } from "../../index"

export default async (oldRole: Role, newRole: Role) => {

    let guild = client!.guilds.cache.get(oldRole.guild!.id)

    if (!guild) return

    let guildHighLogsChannelID = await GetHighLogChannel(guild?.id)
    let highLogsChannel = client.channels.cache.get(guildHighLogsChannelID) as TextChannel

    try {
        let guildLogsChannelID = await GetLogChannel(guild?.id) as string
        let logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

        const AuditLogFetch = await guild!.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleUpdate })
        const Entry = AuditLogFetch.entries.first()

        await HandleLog(
            colors.yellow(`EVENT\nA role was updated\n\
            `) + colors.yellow(`Role name : `) + (`${newRole.name}\n\
            `) + colors.yellow(`Role ID : `) + (`${newRole.id}\n\
            `) + colors.red(`In server : `) + (`${newRole.guild.name}\n\
            `) + colors.red(`Server ID : `) + (`${newRole.guild.id}\n\
            `) + colors.magenta(`Updated by user : `) + (`${Entry?.executor?.username}\n\
            `) + colors.magenta(`User ID : `) + (`${Entry?.executor?.id}\n\
            `) + colors.cyan(`${new Date().toLocaleString()}\n`)
        )

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.displayAvatarURL()}` })
            .setTitle("A role was updated")
            .setColor("Yellow")
            .addFields([
                {
                    name: "Role infos", value: `\
                    Role : <@&${newRole.id}>\n\
                    ID : ${newRole.id}`
                },
                {
                    name: "Executor", value: `\
                    User : <@${Entry?.executor?.id}>\n\
                    ID : ${Entry?.executor?.id}`
                }
            ])
            .setFooter({ text: `${new Date().toLocaleString()}` })

        logsChannel.send({ embeds: [embed] })
    } catch (error) {

        await console.log(`An error occured on RoleUpdate listener\n${error}`)
        await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on VoiceStateUpdate listener\nPlease check console for full details` })
    }
}