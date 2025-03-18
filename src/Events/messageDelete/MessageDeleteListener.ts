import { EmbedBuilder, TextChannel, Message, AuditLogEvent } from "discord.js";
import { GetLogChannel, HandleLog } from "../../functions";
import colors from "colors"
import { botAdmins, client } from "../../index"

export default async(message: Message) => {

    var guild = client!.guilds.cache.get(message.guild!.id)

    var guildLogsChannelID = await GetLogChannel(guild?.id) as string
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

    var executorID
    var executorUsername
    var executorUsernameFormatted

    if (Entry?.createdTimestamp! > Date.now() - 2000) {
        executorUsernameFormatted = `<@${Entry?.executor?.id}>`
        executorUsername = Entry?.executor?.username
        executorID = `${Entry?.executor?.id}`
    } else {
        executorUsernameFormatted = `Either <@${message.author.id}> or Discord automated deletion`
        executorUsername = `Either ${message.author.username} or Discord automated deletion`
        executorID = `Either ${message.author.id} or none`
    }

    const messageChannel = message.channel as TextChannel

    await HandleLog(colors.blue(`EVENT\nMessage deleted\n\
    `) + colors.blue(`From user : `) + (`${message.author?.username}\n\
    `) + colors.blue(`User ID : `) + (`${message.author?.id}\n\
    `) + colors.blue(`In guild : `) + (`${message.guild?.name}\n\
    `) + colors.blue(`Guild ID : `) + (`${message.guild?.id}\n\
    `) + colors.blue(`Content : `) + (`${message.content}\n\
    `) + colors.blue(`Attachments : `) + (`${attachmentsLink}\n\
    `) + colors.blue(`Channel name : `) + (`#${messageChannel.name}\n\
    `) + colors.blue(`Channel ID : `) + (`${messageChannel.id}\n\
    `) + colors.blue(`Message initially sent on : `) + (`${message.createdAt.toLocaleString()}\n\
    `) + colors.magenta(`Executor : `) + (`${executorUsername}\n\
    `) + colors.magenta(`Executor ID : `) + (`${executorID}\n\
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
    message.author == null ? messageAuthorIconURL = "https://fr.wikipedia.org/wiki/Fichier:Flat_cross_icon.svg" : messageAuthorIconURL = message.author.displayAvatarURL()

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
        {name: `Executor`, value: `\nUser : ${executorUsernameFormatted}\nID : ${executorID}\n`},
        ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    if (message.channel.id == guildLogsChannelID && message.author.id == client.user!.id) {
        if (message.embeds[0] != undefined) {
            botAdmins.forEach(admin => {
                try {
                    client.users.cache.find((user) => user.id === admin)?.send({content: `:warning: <@${admin}>!\nUser ${executorUsername} tried to delete a logged message!`, embeds: [message.embeds[0]]})
                } catch (error) {
                    HandleLog(error)
                }
            });
        }
    } else {
        logsChannel.send({embeds: [embed]})
    }
}