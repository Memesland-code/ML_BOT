import colors from "colors"
import { AuditLogEvent, ChannelType, EmbedBuilder, GuildAuditLogs, GuildAuditLogsEntry, TextBasedChannel, TextChannel } from "discord.js"
import { GetHighLogChannel, GetLogChannel, HandleLog } from "../../functions"
import { botAdmins, client } from "../../index"

export default async (channel: TextBasedChannel) => {

    if (channel.type != ChannelType.GuildText) return

    var guild = client!.guilds.cache.get(channel.guild!.id)

    var guildHighLogsChannelID = await GetHighLogChannel(guild?.id)
    var highLogsChannel = client.channels.cache.get(guildHighLogsChannelID) as TextChannel

    try {
        var guildLogsChannelID = await GetLogChannel(guild?.id) as string
        var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

        const AuditLogFetchPinAdd = await guild?.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessagePin })
        const EntryPinAdd = AuditLogFetchPinAdd?.entries.first()

        const AuditLogFetchPinRemove = await guild?.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageUnpin })
        const EntryPinRemove = AuditLogFetchPinRemove?.entries.first()

        var Entry: GuildAuditLogsEntry
        var AuditLog: GuildAuditLogs
        var pinMessage: String

        if (AuditLogFetchPinAdd != null && EntryPinAdd != undefined && EntryPinAdd.createdTimestamp > Date.now() - 1500) {
            Entry = EntryPinAdd
            AuditLog = AuditLogFetchPinAdd
            pinMessage = "New message pinned"
        } else if (AuditLogFetchPinRemove != null && EntryPinRemove != undefined && EntryPinRemove.createdTimestamp > Date.now() - 1500) {
            Entry = EntryPinRemove
            AuditLog = AuditLogFetchPinRemove
            pinMessage = "Message pin was removed"
        } else {
            return
        }

        var modifiedMessageID

        await AuditLogFetchPinAdd?.entries.forEach(element => {
            modifiedMessageID = element.extra.messageId
        });

        await HandleLog(
            colors.yellow(`EVENT\n${pinMessage}\n`) +
            colors.yellow(`In guild : `) + colors.white(`${channel.guild}\n`) +
            colors.yellow(`Guild ID : `) + colors.white(`${channel.guild.id}\n`) +
            colors.yellow(`In channel : `) + colors.white(`${channel.name}\n`) +
            colors.yellow(`Channel ID : `) + colors.white(`${channel.id}\n`) +
            colors.yellow(`In category : `) + colors.white(`${channel.parent?.name}\n`) +
            colors.yellow(`Category ID : `) + colors.white(`${channel.parent?.id}\n`) +
            colors.yellow(`Message ref : `) + colors.white(`https://discord.com/channels/${channel.guild.id}/${channel.id}/${modifiedMessageID}\n`) +
            colors.magenta(`Executor username : `) + colors.white(`${Entry.executor?.username}\n`) +
            colors.magenta(`Executor ID : `) + colors.white(`${Entry.executor?.id}\n`) +
            colors.cyan(`${new Date().toLocaleString()}\n`)
        )

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${Entry.executor?.username}`, iconURL: `${Entry.executor?.displayAvatarURL()}` })
            .setTitle(`${pinMessage}`)
            .setColor("DarkAqua")
            .addFields([
                {
                    name: `Channel infos`, value: `\
                    Channel : <#${channel.id}>\n\
                    ID : ${channel.id}\n\
                    Category : ${channel.parent?.name}\n\
                    ID : ${channel.parent?.id}`
                },
                { name: `Message ref`, value: `[Message](https://discord.com/channels/${channel.guild.id}/${channel.id}/${modifiedMessageID})` },
                {
                    name: `Executor`, value: `\
                    User  : <@${Entry.executor?.id}>\n\
                    ID : ${Entry.executor?.id}`
                }
            ])
            .setFooter({ text: `${new Date().toLocaleString()}` })

        logsChannel.send({ embeds: [embed] })
    } catch (error) {

        await console.log(`An error occured on VoiceStateUpdate listener\n${error}`)
        await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on VoiceStateUpdate listener\nPlease check console for full details` })
    }
}