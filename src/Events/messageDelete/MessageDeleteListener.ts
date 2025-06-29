import colors from "colors";
import { AuditLogEvent, EmbedBuilder, Message, TextChannel } from "discord.js";
import { GetHighLogChannel, GetLogChannel, HandleLog } from "../../functions";
import { botAdmins, client } from "../../index";

export default async (message: Message) => {

    let guild = client!.guilds.cache.get(message.guild!.id)

    if (!guild) return

    let guildHighLogsChannelID = await GetHighLogChannel(guild?.id)
    let highLogsChannel = client.channels.cache.get(guildHighLogsChannelID) as TextChannel

    try {
        let guildLogsChannelID = await GetLogChannel(guild?.id)
        let logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

        const AuditLogFetch = await guild!.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageDelete })
        const Entry = AuditLogFetch.entries.first()

        let attachmentsLink
        let all_attachments: any = []
        if (message.attachments.size > 0) {
            message.attachments.forEach(attachment => {
                let ImageLink = attachment.proxyURL
                all_attachments.push(ImageLink)
            })
            attachmentsLink = all_attachments
        } else attachmentsLink = "No attachment"

        let executorID
        let executorUsername: String | undefined
        let executorUsernameFormatted

        if (Entry?.createdTimestamp! > Date.now() - 1500) {
            executorUsernameFormatted = `<@${Entry?.executor?.id}>`
            executorUsername = Entry?.executor?.username
            executorID = `${Entry?.executor?.id}`
        } else {
            executorUsernameFormatted = `Either <@${message.author.id}> or Discord automated deletion`
            executorUsername = `Either ${message.author.username} or Discord automated deletion`
            executorID = `Either ${message.author.id} or none`
        }

        const messageChannel = message.channel as TextChannel

        await HandleLog(
            colors.blue(`EVENT\nMessage deleted\n`) +
            colors.blue(`From user : `) + colors.white(`${message.author?.username}\n`) +
            colors.blue(`User ID : `) + colors.white(`${message.author?.id}\n`) +
            colors.blue(`In guild : `) + colors.white(`${message.guild?.name}\n`) +
            colors.blue(`Guild ID : `) + colors.white(`${message.guild?.id}\n`) +
            colors.blue(`Content : `) + colors.white(`${message.content}\n`) +
            colors.blue(`Attachments : `) + colors.white(`${attachmentsLink}\n`) +
            colors.blue(`Channel name : `) + colors.white(`#${messageChannel.name}\n`) +
            colors.blue(`Channel ID : `) + colors.white(`${messageChannel.id}\n`) +
            colors.blue(`Message initially sent on : `) + colors.white(`${message.createdAt.toLocaleString()}\n`) +
            colors.magenta(`Executor : `) + colors.white(`${executorUsername}\n`) +
            colors.magenta(`Executor ID : `) + colors.white(`${executorID}\n`) +
            colors.cyan(`${new Date().toLocaleString()}\n`)
        )

        let messageContent
        if (message.content == null) {
            messageContent = "Couldn't fetch previous message content: Discord ToS limitation"
        }
        else if (message.content.length < 900) {
            messageContent = message.content
        }
        else messageContent = "Deleted message was too long to be in an embeded message. Please check the console for full details"

        let messageAuthorUsername
        message.author == null ? messageAuthorUsername = "Unknown" : messageAuthorUsername = message.author.username

        let messageAuthorIconURL
        message.author == null ? messageAuthorIconURL = "https://fr.wikipedia.org/wiki/Fichier:Flat_cross_icon.svg" : messageAuthorIconURL = message.author.displayAvatarURL()

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${messageAuthorUsername}`, iconURL: `${messageAuthorIconURL}` })
            .setTitle("Message deleted")
            .setColor("DarkGold")
            .addFields([
                {
                    name: `Target's message infos`, value: `\n\
                    User : <@${message.author?.id}> \n\
                    User ID : ${message.author?.id}\n\
                    Channel name : <#${messageChannel.id}>\n\
                    Channel ID : ${messageChannel.id}\n`
                },
                { name: `Message content`, value: `\`\`\`fix\n${messageContent}\n\`\`\`` },
                { name: `Attachements`, value: `\n${attachmentsLink}\n` },
                { name: "Message initially sent on", value: `${message.createdAt.toLocaleString()}` },
                { name: `Executor`, value: `\nUser : ${executorUsernameFormatted}\nID : ${executorID}\n` },
            ])
            .setFooter({ text: `${new Date().toLocaleString()}` })

        if ((message.channel.id == guildLogsChannelID || message.channel.id == guildHighLogsChannelID) && message.author.id == client.user!.id) {
            if (message.embeds[0] != undefined) {
                botAdmins.forEach(admin => {
                    try {
                        client.users.cache.find((user) => user.id === admin)?.send({ content: `:warning: <@${admin}>!\nUser ${executorUsername} tried to delete a logged message!`, embeds: [message.embeds[0]] })
                    } catch (error) {
                        HandleLog(error)
                    }
                });
            }
        } else {
            logsChannel.send({ embeds: [embed] })
        }
    } catch (error) {

        await HandleLog(colors.red(`An error occured on MessageDelete listener\n${error}`))
        await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on MessageDelete listener\nPlease check console for full details` })
    }
}