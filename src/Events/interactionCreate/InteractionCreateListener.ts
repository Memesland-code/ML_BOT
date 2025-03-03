import { BaseInteraction, EmbedBuilder, InteractionContextType, TextChannel } from "discord.js"
import { client } from "../../index"
import { getLogChannel } from "../../functions"
import colors from "colors"

export default async(interaction: BaseInteraction) => {

    if (interaction.context != InteractionContextType.Guild) return

    var guild = client!.guilds.cache.get(interaction.guild!.id)
    
    var guildLogsChannelID = await getLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    const channel = interaction.channel as TextChannel

    console.log(colors.blue(`EVENT\nInteraction created\n\
    `) + colors.blue(`In guild : `) + (`${interaction.guild?.name}\n\
    `) + colors.blue(`Guild ID : `) + (`${interaction.guild?.id}\n\
    `) + colors.blue(`By : `) + (`${interaction.user.username}\n\
    `) + colors.blue(`ID : `) + (`${interaction.user.id}\n\
    `) + colors.blue(`In channel : `) + (`${channel.name}\n\
    `) + colors.blue(`Channel ID :`) + (`${channel.id}\n\
    `) + colors.blue(`In category : `) + (`${channel.parent?.name}\n\
    `) + colors.blue(`Category ID : `) + (`${channel.parent?.id}\n\
    `) + colors.blue(`Interaction infos : `) + (`${interaction}\n`))

    const embed = new EmbedBuilder()
    .setAuthor({name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL()}`})
    .setTitle("Interaction created")
    .setColor("LightGrey")
    .addFields([
        {name: `General infos`, value: `\n\
        User : <@${interaction.user.id}>\n\
        User ID : ${interaction.user.id}\n\
        In channel : <#${channel.id}>\n\
        Channel ID : ${channel.id}\n\
        In category : ${channel.parent?.name}\n\
        Category ID : ${channel.parent?.id}`},
        {name: "Interaction infos", value: `\`\`\`fix\n${interaction}\n\`\`\``}
    ])

    logsChannel.send({embeds: [embed]})
}