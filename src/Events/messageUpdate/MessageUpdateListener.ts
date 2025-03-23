import colors from "colors"
import { EmbedBuilder, Message, TextChannel } from "discord.js"
import { GetLogChannel, HandleLog } from "../../functions"
import { client } from "../../index"

export default async (oldMessage: Message, newMessage: Message) => {

    if (oldMessage.partial) oldMessage = await oldMessage.fetch()

    if (newMessage.partial) newMessage = await newMessage.fetch()

    if (newMessage.embeds[0] != undefined) return

    var guild = client!.guilds.cache.get(oldMessage.guild!.id)

    var guildLogsChannelID = await GetLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    let isAttachmentStillThere
    let allAttachments: any = []
    if (newMessage.attachments.size !== oldMessage.attachments.size) {
        oldMessage.attachments.forEach(attachment => {
            const ImageLink = attachment.proxyURL
            allAttachments.push(ImageLink)
        })
        isAttachmentStillThere = allAttachments
    } else isAttachmentStillThere = `No attachment changes`

    let isAttachment;
    let all_attachments: any = []
    if (newMessage.attachments.size > 0) {
        newMessage.attachments.forEach(attachment => {
            const ImageLink = attachment.proxyURL;
            all_attachments.push(ImageLink)
        })
        isAttachment = all_attachments
    } else isAttachment = `No attachment`

    const messageChannel = oldMessage.channel as TextChannel

    await HandleLog(
        colors.blue((`EVENT\nMessage modified\n`) +
            colors.blue(`In guild : `) + colors.white(`${oldMessage.guild?.name}\n`) +
            colors.blue(`Guild ID : `) + colors.white(`${oldMessage.guild?.id}\n`) +
            colors.blue(`By : `) + colors.white(`${oldMessage.author?.username}\n`) +
            colors.blue(`ID : `) + colors.white(`${oldMessage.author?.id}\n`) +
            colors.blue(`Old message : `) + colors.white(`${oldMessage.content}\n`) +
            colors.blue(`New message : `) + colors.white(`${newMessage.content}\n`) +
            colors.blue(`Attachments if modified : `) + colors.white(`${isAttachmentStillThere}\n`) +
            colors.blue(`Current attachments : `) + colors.white(`${isAttachment}\n`) +
            colors.blue(`Channel name : `) + colors.white(`${messageChannel.name}\n`) +
            colors.blue(`Channel ID : `) + colors.white(`${messageChannel.id}\n`) +
            colors.blue(`Message initially sent : `) + colors.white(`${oldMessage.createdAt.toLocaleString()}\n`) +
            colors.cyan(`${new Date().toLocaleString()}\n`))
    )

    let oldMessageContent
    if (oldMessage.content.length < 900) {
        oldMessageContent = oldMessage.content
    } else oldMessageContent = "Old message was too long to be in an embeded message. Please check the console for full details"

    let newMessageContent
    if (newMessage.content.length < 900) {
        newMessageContent = newMessage.content
    } else newMessageContent = "New message was too long to be in an embeded message. Please check the console for full details"


    if (oldMessage === newMessage) oldMessageContent = "Couldn't fetch previous message content: Discord ToS limitation"


    const embed = new EmbedBuilder()
        .setAuthor({ name: `${oldMessage.author.username}`, iconURL: `${oldMessage.author.displayAvatarURL()}` })
        .setTitle("Message modified")
        .setColor("Gold")
        .addFields([
            { name: "User's message infos", value: `\nUser : <@${oldMessage.author.id}>\nUser ID : ${oldMessage.author.id}\nChannel name : <#${messageChannel.id}>\nChannel ID : ${messageChannel.id}` },
            { name: "Old message content", value: `\`\`\`fix\n${oldMessageContent}\n\`\`\`` },
            { name: "New message content", value: `\`\`\`fix\n${newMessageContent}\n\`\`\`` },
            { name: "Old message attachments if removed", value: `${isAttachmentStillThere}` },
            { name: "Current attachments", value: `${isAttachment}` },
            { name: "Message initially sent", value: `${oldMessage.createdAt.toLocaleString()}` }
        ])
        .setFooter({ text: `${new Date().toLocaleString()}` })

    logsChannel.send({ embeds: [embed] })
}