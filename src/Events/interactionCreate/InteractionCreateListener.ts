import colors from "colors"
import { BaseInteraction, EmbedBuilder, InteractionContextType, TextChannel } from "discord.js"
import { GetHighLogChannel, GetLogChannel, HandleLog } from "../../functions"
import { botAdmins, client } from "../../index"

export default async (interaction: BaseInteraction) => {

    if (interaction.context != InteractionContextType.Guild) return

    let guild = client!.guilds.cache.get(interaction.guild!.id)

    if (!guild) return

    let guildHighLogsChannelID = await GetHighLogChannel(guild?.id)
    let highLogsChannel = client.channels.cache.get(guildHighLogsChannelID) as TextChannel

    try {
        let guildLogsChannelID = await GetLogChannel(guild?.id) as string
        let logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

        const channel = interaction.channel as TextChannel

        await HandleLog(
            colors.blue(`EVENT\nInteraction created\n`) +
            colors.blue(`In guild : `) + colors.white(`${interaction.guild?.name}\n`) +
            colors.blue(`Guild ID : `) + colors.white(`${interaction.guild?.id}\n`) +
            colors.blue(`By : `) + colors.white(`${interaction.user.username}\n`) +
            colors.blue(`ID : `) + colors.white(`${interaction.user.id}\n`) +
            colors.blue(`In channel : `) + colors.white(`${channel.name}\n`) +
            colors.blue(`Channel ID :`) + colors.white(`${channel.id}\n`) +
            colors.blue(`In category : `) + colors.white(`${channel.parent?.name}\n`) +
            colors.blue(`Category ID : `) + colors.white(`${channel.parent?.id}\n`) +
            colors.blue(`Interaction infos : `) + colors.white(`${interaction}\n`) +
            colors.cyan(`${new Date().toLocaleString()}\n`)
        )

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL()}` })
            .setTitle("Interaction created")
            .setColor("LightGrey")
            .addFields([
                {
                    name: `General infos`, value: `\n\
                    User : <@${interaction.user.id}>\n\
                    User ID : ${interaction.user.id}\n\
                    In channel : <#${channel.id}>\n\
                    Channel ID : ${channel.id}\n\
                    In category : ${channel.parent?.name}\n\
                    Category ID : ${channel.parent?.id}`
                },
                { name: "Interaction infos", value: `\`\`\`fix\n${interaction}\n\`\`\`` }
            ])

        logsChannel.send({ embeds: [embed] })
    } catch (error) {

        await HandleLog(colors.red(`An error occured on InteractionCreate listener\n${error}`))
        await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on InteractionCreate listener\nPlease check console for full details` })
    }


}