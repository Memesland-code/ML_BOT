import colors from "colors"
import { AuditLogEvent, EmbedBuilder, Role, TextChannel } from "discord.js"
import { GetHighLogChannel, GetLogChannel, HandleLog } from "../../functions"
import { botAdmins, client } from "../../index"

export default async (role: Role) => {

    var guild = client!.guilds.cache.get(role.guild!.id)

    if (!guild) return

    var guildHighLogsChannelID = await GetHighLogChannel(guild?.id)
    var highLogsChannel = client.channels.cache.get(guildHighLogsChannelID) as TextChannel

    try {
        var guildLogsChannelID = await GetLogChannel(guild?.id) as string
        var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

        const AuditLogFetch = await guild?.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleCreate });
        const Entry = AuditLogFetch?.entries.first();

        await HandleLog(
            colors.yellow(`EVENT\nNew role created\n`) +
            colors.yellow(`ID : `) + colors.white(`${role.id}\n`) +
            colors.red(`In server : `) + colors.white(`${role.guild.name}\n`) +
            colors.red(`Server ID : `) + colors.white(`${role.guild.id}\n`) +
            colors.magenta(`Créé par : `) + colors.white(`${Entry?.executor?.tag}\n`) +
            colors.magenta(`ID : `) + colors.white(`${Entry?.executor?.id}\n`) +
            colors.cyan(`${new Date().toLocaleString()}\n`)
        )

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.displayAvatarURL()}` })
            .setTitle("New role created")
            .setColor("DarkGreen")
            .addFields([
                { name: `Role ID`, value: `${role.id}` },
                { name: `Executor`, value: `User : <@${Entry?.executor?.id}>\nUser ID : ${Entry?.executor?.id}` }
            ])
            .setFooter({ text: `${new Date().toLocaleString()}` })

        logsChannel.send({ embeds: [embed] })
    } catch (error) {

        await console.log(`An error occured on VoiceStateUpdate listener\n${error}`)
        await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on VoiceStateUpdate listener\nPlease check console for full details` })
    }
}