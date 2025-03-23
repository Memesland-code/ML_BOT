import colors from "colors"
import { AuditLogEvent, EmbedBuilder, Guild, TextChannel } from "discord.js"
import { GetHighLogChannel, GetLogChannel, HandleLog } from "../../functions"
import { botAdmins, client } from "../../index"

export default async (_oldGuild: Guild, newGuild: Guild) => {

    let guild = client!.guilds.cache.get(newGuild.id)

    if (!guild) return

    let guildHighLogsChannelID = await GetHighLogChannel(guild?.id)
    let highLogsChannel = client.channels.cache.get(guildHighLogsChannelID) as TextChannel

    try {
        let guildLogsChannelID = await GetLogChannel(guild?.id) as string
        let logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

        const AuditLogFetch = await guild?.fetchAuditLogs({ limit: 1, type: AuditLogEvent.GuildUpdate });
        const Entry = AuditLogFetch?.entries.first();

        await HandleLog(
            colors.yellow(`EVENT\nServer was updated\n`) +
            colors.yellow(`Server : `) + colors.white(`${newGuild.name}\n`) +
            colors.yellow(`Server ID : `) + colors.white(`${newGuild.id}\n`) +
            colors.magenta(`Executor : `) + colors.white(`${Entry?.executor!.username}\n`) +
            colors.magenta(`ID : `) + colors.white(`${Entry?.executor!.id}\n`) +
            colors.cyan(`${new Date().toLocaleString()}\n`)
        )

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.displayAvatarURL()}` })
            .setTitle("Server was updated")
            .setColor("DarkBlue")
            .addFields([
                {
                    name: `Executor`, value: `\
                    User : <@${Entry?.executor?.id}>\n\
                    ID : ${Entry?.executor?.id}`
                }
            ])
            .setFooter({ text: `${new Date().toLocaleString()}` })

        logsChannel.send({ embeds: [embed] })
    } catch (error) {

        await console.log(`An error occured on VoiceStateUpdate listener\n${error}`)
        await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on VoiceStateUpdate listener\nPlease check console for full details` })
    }


}