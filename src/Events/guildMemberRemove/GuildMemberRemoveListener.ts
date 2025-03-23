import colors from "colors";
import { EmbedBuilder, GuildMember, TextChannel } from "discord.js";
import { GetHighLogChannel, GetLogChannel, HandleLog } from "../../functions";
import { botAdmins, client } from "../../index";

export default async (member: GuildMember) => {

    let guild = client!.guilds.cache.get(member.guild.id)

    if (!guild) return

    let guildHighLogsChannelID = await GetHighLogChannel(guild?.id)
    let highLogsChannel = client.channels.cache.get(guildHighLogsChannelID) as TextChannel

    try {
        let guildLogsChannelID = await GetLogChannel(guild?.id) as string
        let logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

        await HandleLog(
            colors.blue(`EVENT\nA member quitted the server\n`) +
            colors.blue("User username : ") + colors.white(`${member.user.username}\n`) +
            colors.blue("User ID : ") + colors.white(`${member.user.id}\n`) +
            colors.blue(`In guild : `) + colors.white(`${member.guild?.name}\n`) +
            colors.blue(`Guild ID : `) + colors.white(`${member.guild?.id}\n`) +
            colors.blue("Server members number : ") + colors.white(`${guild?.members.cache.size}\n`) +
            colors.cyan(`${new Date().toLocaleString()}\n`)
        )

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${member.user.username}`, iconURL: `${member.user.displayAvatarURL()}` })
            .setTitle("A member quitted the server")
            .setColor("Red")
            .addFields([
                { name: "User username", value: `<@${member.user.id}>` },
                { name: "User ID", value: `${member.user.id}` },
                { name: "Account age", value: `${Math.floor((new Date().getTime() - member.user.createdAt.getTime()) / 86400000)} days` },
                { name: "Account creation date", value: `${member.user.createdAt.toLocaleString()}` },
                { name: "Server members number : ", value: `${guild?.memberCount}` }
            ])
            .setFooter({ text: `Quitted on ${new Date().toLocaleString()}` })

        logsChannel.send({ embeds: [embed] })
    } catch (error) {

        await console.log(`An error occured on GuildMemberRemove listener\n${error}`)
        await highLogsChannel.send({ content: `<@${botAdmins[0]}> An error occured on VoiceStateUpdate listener\nPlease check console for full details` })
    }
}