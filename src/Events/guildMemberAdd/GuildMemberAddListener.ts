import { EmbedBuilder, GuildMember, TextChannel } from "discord.js";
import { getLogChannel } from "../../functions";
import colors from "colors"
import { client } from "../../index"

export default async(member: GuildMember) => {

    var guild = client!.guilds.cache.get(member.guild.id)
    
    var guildLogsChannelID = await getLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    console.log(colors.blue(`EVENT\nNew member joined server\n\
    `) + colors.blue("User username : ") + (`${member.user.username}\n\
    `) + colors.blue("User ID : ") + (`${member.user.id}\n\
    `) + colors.blue(`In guild : `) + (`${member.guild?.name}\n\
    `) + colors.blue(`Guild ID : `) + (`${member.guild?.id}\n\
    `) + colors.blue("Server members number : ") + (`${guild?.members.cache.size}\n\
    `) + colors.cyan(`${new Date().toLocaleString()}\n`))
    
    const embed = new EmbedBuilder()
    .setAuthor({name: `${member.user.username}`, iconURL: `${member.user.displayAvatarURL()}`})
    .setTitle("New member joined")
    .setColor("Green")
    .addFields([
        {name: "User username", value: `<@${member.user.id}>`},
        {name: "User ID", value: `${member.user.id}`},
        {name: "Account age", value: `${Math.floor((new Date().getTime() - member.user.createdAt.getTime()) / 86400000)} days`},
        {name: "Account creation date", value: `${member.user.createdAt.toLocaleString()}`},
        {name : "Server members number : ", value: `${guild?.memberCount}`}
    ])
    .setFooter({text: `Joinded on ${new Date().toLocaleString()}`})

    logsChannel.send({embeds: [embed]})
}