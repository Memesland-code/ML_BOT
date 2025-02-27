import { AuditLogEvent, ChannelType, Collection, EmbedBuilder, GuildAuditLogs, GuildAuditLogsEntry, Message, TextBasedChannel, TextChannel } from "discord.js"
import { client } from "../../index"
import { getLogChannel } from "../../functions"
import colors from "colors"

export default async(channel: TextBasedChannel, time: Date) => {

    if (channel.type !=  ChannelType.GuildText) return

    var guild = client!.guilds.cache.get(channel.guild!.id)
    
    var guildLogsChannelID = await getLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const AuditLogFetchPinAdd = await guild?.fetchAuditLogs({limit: 1, type: AuditLogEvent.MessagePin})
    const EntryPinAdd = AuditLogFetchPinAdd?.entries.first()

    const AuditLogFetchPinRemove = await guild?.fetchAuditLogs({limit: 1, type: AuditLogEvent.MessageUnpin})
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

    console.log(colors.yellow(`EVENT\n${pinMessage}\n\
    `) + colors.yellow(`In guild : `) + (`${channel.guild}\n\
    `) + colors.yellow(`Guild ID : `) + (`${channel.guild.id}\n\
    `) + colors.yellow(`In channel : `) + (`${channel.name}\n\
    `) + colors.yellow(`Channel ID : `) + (`${channel.id}\n\
    `) + colors.yellow(`In category : `) + (`${channel.parent?.name}\n\
    `) + colors.yellow(`Category ID : `) + (`${channel.parent?.id}\n\
    `) + colors.yellow(`Message ref : `) + (`https://discord.com/channels/${channel.guild.id}/${channel.id}/${modifiedMessageID}\n\
    `) + colors.magenta(`Executor username : `) + (`${Entry.executor?.username}\n\
    `) + colors.magenta(`Executor ID : `) + (`${Entry.executor?.id}\n\
    `) + colors.cyan(`${new Date().toLocaleString()}\n`))

    const embed = new EmbedBuilder()
    .setAuthor({name: `${Entry.executor?.username}`, iconURL: `${Entry.executor?.avatarURL()}`})
    .setTitle(`${pinMessage}`)
    .setColor("DarkAqua")
    .addFields([
        {name: `Channel infos`, value: `\
        Channel : <#${channel.id}>\n\
        ID : ${channel.id}\n\
        Category : ${channel.parent?.name}\n\
        ID : ${channel.parent?.id}`},
        {name: `Message ref`, value: `[Message](https://discord.com/channels/${channel.guild.id}/${channel.id}/${modifiedMessageID})`},
        {name: `Executor`, value: `\
        User  : <@${Entry.executor?.id}>\n\
        ID : ${Entry.executor?.id}`}
    ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    logsChannel.send({embeds: [embed]})
}