import { EmbedBuilder, GuildBan, TextChannel } from "discord.js"
import { client } from "../../index"
import { getLogChannel } from "../../functions"
import colors from "colors"

export default async(ban: GuildBan) => {

    var guild = client!.guilds.cache.get(ban.guild!.id)
    
    var guildLogsChannelID = await getLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    console.log(colors.red(`EVENT\nAn user ban was revoked from server\n\
    `) + colors.red(`Unbbanned user username : `) + (`${ban.user.username}\n\
    `) + colors.red(`Unbanned user ID : `) + (`${ban.user.id}\n\
    `) + colors.red(`In server : `) + (`${ban.guild.name}\n\
    `) + colors.red(`Server ID : `) + (`${ban.guild.id}\n\
    `) + colors.magenta(`Executor : `) + (`${ban.client.user.username}\n\
    `) + colors.magenta(`ID : `) + (`${ban.client.user.id}\n\
    `) + colors.cyan(`${new Date().toLocaleString()}\n`))

    const embed = new EmbedBuilder()
    .setAuthor({name: `${ban.user.username}`, iconURL: `${ban.user.displayAvatarURL()}`})
    .setTitle("User was unbanned from server")
    .setColor("DarkRed")
    .addFields([
        {name: "User's infos", value: `\
        User : <@${ban.user.id}>\n\
        ID : ${ban.user.id}`},
        {name: "Executor", value: `\
        User : <@${ban.client.user.id}>\n\
        ID : ${ban.client.user.id}`}
    ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    logsChannel.send({embeds: [embed]})
}