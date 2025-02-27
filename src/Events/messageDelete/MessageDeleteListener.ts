import { EmbedBuilder, TextChannel, Message, AuditLogEvent, User } from "discord.js";
import { getLogChannel } from "../../functions";
import colors from "colors"
import { botAdmins, client } from "../../index"

export default async(message: Message) => {

    var guild = client!.guilds.cache.get(message.guild!.id)

    var guildLogsChannelID = await getLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const AuditLogFetch = await guild!.fetchAuditLogs({limit: 1, type: AuditLogEvent.MessageDelete})
    const Entry = AuditLogFetch.entries.first()

    let attachmentsLink
    let all_attachments: any = []
    if (message.attachments.size > 0) {
        message.attachments.forEach(attachment => {
            var ImageLink = attachment.proxyURL
            all_attachments.push(ImageLink)
        })
        attachmentsLink = all_attachments
    } else attachmentsLink = "No attachment"

    var executor
    Entry?.executor == undefined ? executor = message.author : executor = Entry.executor

    const messageChannel = message.channel as TextChannel

    console.log(colors.blue(`EVENT\nMessage deleted\n\
    `) + colors.blue(`From user : `) + (`${message.author?.username}\n\
    `) + colors.blue(`User ID : `) + (`${message.author?.id}\n\
    `) + colors.blue(`In guild : `) + (`${message.guild?.name}\n\
    `) + colors.blue(`Guild ID : `) + (`${message.guild?.id}\n\
    `) + colors.blue(`Content : `) + (`${message.content}\n\
    `) + colors.blue(`Attachments : `) + (`${attachmentsLink}\n\
    `) + colors.blue(`Channel name : `) + (`#${messageChannel.name}\n\
    `) + colors.blue(`Channel ID : `) + (`${messageChannel.id}\n\
    `) + colors.blue(`Message initially sent on : `) + (`${message.createdAt.toLocaleString()}\n\
    `) + colors.magenta(`Executor : `) + (`${executor?.username}\n\
    `) + colors.magenta(`Executor ID : `) + (`${executor?.id}\n\
    `) + colors.cyan(`${new Date().toLocaleString()}\n`))

    let messageContent
    if (message.content == null) {
        messageContent = "Couldn't fetch previous message content: Discord ToS limitation"
    }
    else if (message.content.length < 900)
    {
        messageContent = message.content
    }
    else messageContent = "Deleted message was too long to be in an embeded message. Please check the console for full details"

    var messageAuthorUsername
    message.author == null ? messageAuthorUsername = "Unknown" : messageAuthorUsername = message.author.username

    var messageAuthorIconURL
    message.author == null ? messageAuthorIconURL = "https://fr.wikipedia.org/wiki/Fichier:Flat_cross_icon.svg" : messageAuthorIconURL = message.author.avatarURL()

    const embed = new EmbedBuilder()
    .setAuthor({name: `${messageAuthorUsername}`, iconURL: `${messageAuthorIconURL}`})
    .setTitle("Message deleted")
    .setColor("DarkGold")
    .addFields([
        {name: `Target's message infos`, value: `\n\
        User : <@${message.author?.id}> \n\
        User ID : ${message.author?.id}\n\
        Channel name : <#${messageChannel.id}>\n\
        Channel ID : ${messageChannel.id}\n`},
        {name: `Message content`, value: `\`\`\`fix\n${messageContent}\n\`\`\``},
        {name: `Attachements`, value: `\n${attachmentsLink}\n`},
        {name: "Message initially sent on", value: `${message.createdAt.toLocaleString()}`},
        {name: `Executor`, value: `\nUser : <@${executor?.id}>\nID : ${executor?.id}\n`},
        ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    if (message.channel.id == guildLogsChannelID && message.author.id == client.user!.id) {
        if (message.embeds[0] != undefined) {
            botAdmins.forEach(admin => {
                try {
                    client.users.cache.find((user) => user.id === admin)?.send({content: `:warning: <@${admin}>!\nUser ${executor.username} tried to delete a logged message!`, embeds: [message.embeds[0]]})
                } catch (error) {
                    console.log(error)
                }
            });
        }
    } else {
        logsChannel.send({embeds: [embed]})
    }
}