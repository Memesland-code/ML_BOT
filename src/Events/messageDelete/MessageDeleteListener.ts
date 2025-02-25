import { EmbedBuilder, Client, TextChannel, Message, User } from "discord.js";
import { getLogChannel } from "../../functions";
import colors from "colors"
import { botAdmins, client } from "../../index"

export default async(message: Message) => {

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

    console.log(colors.blue(`EVENT\nMessage deleted\n`) + colors.blue(`From user : `) + (`${message.author?.username}\n`) + colors.blue(`User ID : `) + (`${message.author?.id}\n`) + colors.blue(`Content : `) + (`${message.content}\n`) + colors.blue(`Attachments : `) + (`${attachmentsLink}\n`) + colors.blue(`Channel name : `) + (`#${messageChannel.name}\n`) + colors.blue(`Channel ID : `) + (`${messageChannel.id}\n`) + colors.magenta(`Executor : `) + (`${executor?.username}\n`) + colors.magenta(`Executor ID : `) + (`${executor?.id}\n`) + colors.cyan(`${new Date().toLocaleString()}\n`))

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
        logsChannel!.send({embeds: [embed]})
    }
}