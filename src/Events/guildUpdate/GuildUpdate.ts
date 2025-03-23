import colors from "colors"
import { AuditLogEvent, EmbedBuilder, Guild, TextChannel } from "discord.js"
import { GetLogChannel, HandleLog } from "../../functions"
import { client } from "../../index"

export default async (_oldGuild: Guild, newGuild: Guild) => {

    var guild = client!.guilds.cache.get(newGuild.id)

    var guildLogsChannelID = await GetLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

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
}