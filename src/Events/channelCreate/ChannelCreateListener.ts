import colors from "colors"
import { AuditLogEvent, EmbedBuilder, GuildChannel, TextChannel } from "discord.js"
import { GetHighLogChannel, GetLogChannel, HandleLog } from "../../functions"
import { botAdmins, client } from "../../index"

export default async (channel: GuildChannel) => {

    let guild = client!.guilds.cache.get(channel.guild!.id)

    if (!guild) return

    let guildHighLogsChannelID = await GetHighLogChannel(guild?.id)
    let highLogsChannel = client.channels.cache.get(guildHighLogsChannelID) as TextChannel

    try {
        let guildLogsChannelID = await GetLogChannel(guild?.id) as string
        let logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

        const AuditLogFetch = await guild?.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate });
        const Entry = AuditLogFetch?.entries.first();

        await HandleLog(
            colors.yellow(`EVENT\nNew channel created\n`) +
            colors.yellow(`In server : `) + colors.white(`${channel.guild.name}\n`) +
            colors.yellow(`Server ID : `) + colors.white(`${channel.guild.id}\n`) +
            colors.yellow(`Channel name : `) + colors.white(`${channel.name}\n`) +
            colors.yellow(`ID : `) + colors.white(`${channel.id}\n`) +
            colors.yellow(`Channel type : `) + colors.white(`${channel.parent?.name}\n`) +
            colors.yellow(`Channel ID : `) + colors.white(`${channel.parent?.id}\n`) +
            colors.yellow(`In category : `) + colors.white(`${channel.parent?.name}\n`) +
            colors.yellow(`Category ID : `) + colors.white(`${channel.parent?.id}\n`) +
            colors.magenta(`Executor : `) + colors.white(`${Entry?.executor!.username}\n`) +
            colors.magenta(`ID : `) + colors.white(`${Entry?.executor!.id}\n`) +
            colors.cyan(`${new Date().toLocaleString()}\n`)
        )

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.displayAvatarURL()}` })
            .setTitle("New channel created")
            .setColor("Blue")
            .addFields([
                {
                    name: "Channel's infos", value: `\
                    Channel : <#${channel.id}>\n\
                    Channel ID : ${channel.id}\n\
                    Channel type : ${channel.type}
                    In category : ${channel.parent?.name}\n\
                    Category ID : ${channel.parent?.id}`
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

        await console.log(`An error occured on VoiceStateUpdate listener\n${error}`)
        await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on VoiceStateUpdate listener\nPlease check console for full details` })
    }
}