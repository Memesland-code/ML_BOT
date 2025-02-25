import { EmbedBuilder, Client, TextChannel, Message } from "discord.js";
import WOK from "wokcommands"
import { getLogChannel } from "../../functions";
import colors from "colors"
import { client } from "../../index"

export default async(message: Message, instance: WOK) => {

    var guild = client!.guilds.cache.get(message.guild!.id)

    var guildLogsChannelID = await getLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const AuditLogFetch = await guild!.fetchAuditLogs({limit: 1, type: 72})
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

    console.log(colors.blue(`EVENT\nMessage supprimé\n`) + colors.blue(`De l'utilisateur : `) + (`${message.author?.username}\n`) + colors.blue(`ID : `) + (`${message.author?.id}\n`) + colors.blue(`Contenu : `) + (`${message.content}\n`) + colors.blue(`Pièce(s) jointe(s) si existante(s) : `) + (`${attachmentsLink}\n`) + colors.blue(`Channel name : `) + (`#${messageChannel.name}\n`) + colors.blue(`Channel ID : `) + (`${messageChannel.id}\n`) + colors.magenta(`Par : `) + (`${executor?.username}\n`) + colors.magenta(`ID : `) + (`${executor?.id}\n`) + colors.cyan(`${new Date().toLocaleString()}\n`))

    let messageContent
    if (message.content!.length < 900) {
        messageContent = message.content
    } else messageContent = "Deleted message too long for Discord. Please check the console for full details"

    const embed = new EmbedBuilder()
    .setAuthor({name: `${message.author!.username}`, iconURL: `${message.author!.avatarURL()}`})
    .setTitle("Message deleted")
    .setColor("DarkGold")
    .addFields([
        {name: `User's message infos`, value: `\nUser : <@${message.author?.id}> \nUser ID : ${message.author?.id}\nChannel name : <#${messageChannel.id}>\nChannel ID : ${messageChannel.id}\n`},
        {name: `Message content`, value: `\`\`\`fix\n${messageContent}\n\`\`\``},
        {name: `Attachements`, value: `\`\`\`md\n${attachmentsLink}\n\`\`\``},
        {name: `Executor`, value: `\nUser : <@${executor?.id}>\nID : ${executor?.id}\n`},
        ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    logsChannel!.send({embeds: [embed]})
}