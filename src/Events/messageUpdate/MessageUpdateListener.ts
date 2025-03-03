import { EmbedBuilder, Message, TextChannel } from "discord.js"
import { client } from "../../index"
import { getLogChannel } from "../../functions"
import colors from "colors"

export default async(oldMessage: Message, newMessage: Message) => {

    if (oldMessage.partial) oldMessage = await oldMessage.fetch()

    if (newMessage.partial) newMessage = await newMessage.fetch()

    var guild = client!.guilds.cache.get(oldMessage.guild!.id)
    
    var guildLogsChannelID = await getLogChannel(guild?.id) as string
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
    if(newMessage.attachments.size > 0) {
      newMessage.attachments.forEach(attachment => {
        const ImageLink = attachment.proxyURL;
        all_attachments.push(ImageLink)
      })
      isAttachment = all_attachments
    } else isAttachment = `No attachment`

    const messageChannel = oldMessage.channel as TextChannel

    console.log(colors.blue(`EVENT\nMessage modified\n\
    `) + colors.blue(`In guild : `) + (`${oldMessage.guild?.name}\n\
    `) + colors.blue(`Guild ID : `) + (`${oldMessage.guild?.id}\n\
    `) + colors.blue(`By : `) + (`${oldMessage.author?.username}\n\
    `) + colors.blue(`ID : `) + (`${oldMessage.author?.id}\n\
    `) + colors.blue(`Old message : `) + (`${oldMessage.content}\n\
    `) + colors.blue(`New message : `) + (`${newMessage.content}\n\
    `) + colors.blue(`Attachments if modified : `) + (`${isAttachmentStillThere}\n\
    `) + colors.blue(`Current attachments : `) + (`${isAttachment}\n\
    `) + colors.blue(`Channel name : `) + (`${messageChannel.name}\n\
    `) + colors.blue(`Channel ID : `) + (`${messageChannel.id}\n\
    `) + colors.blue(`Message initially sent : `) + (`${oldMessage.createdAt.toLocaleString()}\n\
    `) + colors.cyan(`${new Date().toLocaleString()}\n`))

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
    .setAuthor({name: `${oldMessage.author.username}`, iconURL: `${oldMessage.author.displayAvatarURL()}`})
    .setTitle("Message modified")
    .setColor("Gold")
    .addFields([
        {name: "User's message infos", value: `\nUser : <@${oldMessage.author.id}>\nUser ID : ${oldMessage.author.id}\nChannel name : <#${messageChannel.id}>\nChannel ID : ${messageChannel.id}`},
        {name: "Old message content", value: `\`\`\`fix\n${oldMessageContent}\n\`\`\``},
        {name: "New message content", value: `\`\`\`fix\n${newMessageContent}\n\`\`\``},
        {name: "Old message attachments if removed", value: `${isAttachmentStillThere}`},
        {name: "Current attachments", value: `${isAttachment}`},
        {name: "Message initially sent", value: `${oldMessage.createdAt.toLocaleString()}`}
    ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    logsChannel.send({embeds: [embed]})
}