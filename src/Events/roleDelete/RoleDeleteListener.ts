import colors from "colors"
import { AuditLogEvent, EmbedBuilder, Role, TextChannel } from "discord.js"
import { GetHighLogChannel, GetLogChannel, HandleLog } from "../../functions"
import { botAdmins, client } from "../../index"

export default async (role: Role) => {

    let guild = client!.guilds.cache.get(role.guild!.id)

    if (!guild) return

    let guildHighLogsChannelID = await GetHighLogChannel(guild?.id)
    let highLogsChannel = client.channels.cache.get(guildHighLogsChannelID) as TextChannel

    try {
        let guildLogsChannelID = await GetLogChannel(guild?.id) as string
        let logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

        const AuditLogFetch = await guild?.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete });
        const Entry = AuditLogFetch?.entries.first();

        await HandleLog(
            colors.yellow(`EVENT\nA role was deleted\n`) +
            colors.yellow(`Role name : `) + colors.white(`${role.name}\n`) +
            colors.yellow(`ID : `) + colors.white(`${role.id}\n`) +
            colors.yellow(`Hex color : `) + colors.white(`${role.hexColor}\n`) +
            colors.yellow(`Shown separated from other roles : `) + colors.white(`${role.hoist}\n`) +
            colors.yellow(`List position : `) + colors.white(`${role.rawPosition}\n`) +
            colors.red(`In server : `) + colors.white(`${role.guild.name}\n`) +
            colors.red(`Server ID : `) + colors.white(`${role.guild.id}\n`) +
            colors.magenta(`Deleted by : `) + colors.white(`${Entry?.executor?.username}\n`) +
            colors.magenta(`ID : `) + colors.white(`${Entry?.executor?.id}\n`) +
            colors.cyan(`${new Date().toLocaleString()}\n`)
        )

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${Entry?.executor?.username}`, iconURL: `${Entry?.executor?.displayAvatarURL()}` })
            .setTitle("A role was deleted")
            .setColor("Red")
            .addFields([
                { name: "Roles infos", value: `\`\`\`md\n[Role name][${role.name}]\n[Role ID][${role.id}]\n[Hex color][${role.hexColor}]\n[Shown separated from other roles][${role.hoist}]\n[List position][${role.position}]\n\`\`\`` },
                { name: "Role initially created on", value: `${role.createdAt.toLocaleString()}` },
                {
                    name: "Executor", value: `\
                    User : <@${Entry?.executor?.id}>\n\
                    ID : ${Entry?.executor?.id}`
                }
            ])
            .setFooter({ text: `${new Date().toLocaleString()}` })

        logsChannel.send({ embeds: [embed] })
    } catch (error) {

        await console.log(`An error occured on RoleDelete listener\n${error}`)
        await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on VoiceStateUpdate listener\nPlease check console for full details` })
    }
}