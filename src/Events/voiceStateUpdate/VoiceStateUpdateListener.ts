import { APIEmbedField, CategoryChannel, EmbedBuilder, TextChannel, User, VoiceBasedChannel, VoiceState } from "discord.js";
import { client } from "../../index"
import { getLogChannel } from "../../functions";
import colors from "colors"

export default async(oldVoiceState: VoiceState, newVoiceState: VoiceState) => {

    var guild = client!.guilds.cache.get(oldVoiceState.guild!.id)
    
    var guildLogsChannelID = await getLogChannel(guild?.id) as string
    var logsChannel = client.channels.cache.get(guildLogsChannelID) as TextChannel

    var voiceChannelInteraction: String = ""
    var voiceChannelUser: User
    var voiceChannel: VoiceBasedChannel
    var voiceChannelCategory: CategoryChannel

    if (oldVoiceState.channel == undefined) {
        voiceChannelInteraction = "User connected to voice channel"
        voiceChannelUser = newVoiceState.member?.user!
        voiceChannel = newVoiceState.channel!
        voiceChannelCategory = newVoiceState.channel?.parent!
    } else if (newVoiceState.channel == undefined) {
        voiceChannelInteraction = "User disconnected from voice channel"
        voiceChannelUser = oldVoiceState.member?.user!
        voiceChannel = oldVoiceState.channel!
        voiceChannelCategory = oldVoiceState.channel?.parent!
    } else {
        voiceChannelInteraction = "Vocal state of user changed"
        voiceChannelUser = oldVoiceState.member?.user!
        voiceChannel = oldVoiceState.channel!
        voiceChannelCategory = oldVoiceState.channel?.parent!
    }

    console.log(colors.blue(`EVENT\nVocal state of user changed\n\
    `) + colors.blue(`Modified user : `) + (`${voiceChannelUser.username}\n\
    `) + colors.blue(`User ID : `) + (`${voiceChannelUser.id}\n\
    `) + colors.magenta(`${voiceChannelInteraction}\n\
    `) + colors.blue(`Channel name : `) + (`${voiceChannel.name}\n\
    `) + colors.blue(`Channel ID : `) + (`${voiceChannel.id}\n\
    `) + colors.blue(`Category name : `) + (`${voiceChannelCategory.name}\n\
    `) + colors.blue(`Category ID : `) + (`${voiceChannelCategory.id}\n\
    `) + colors.blue(`Old server muted : `) + (`${oldVoiceState.serverMute}\n\
    `) + colors.blue(`New server muted : `) + (`${newVoiceState.serverMute}\n\
    `) + colors.blue(`Old server deaf : `) + (`${oldVoiceState.serverDeaf}\n\
    `) + colors.blue(`New server deaf : `) + (`${newVoiceState.serverDeaf}\n\
    `) + colors.blue(`Old self muted : `) + (`${oldVoiceState.selfMute}\n\
    `) + colors.blue(`New self muted : `) + (`${newVoiceState.selfMute}\n\
    `) + colors.blue(`Old self deaf : `) + (`${oldVoiceState.selfDeaf}\n\
    `) + colors.blue(`New self deaf : `) + (`${newVoiceState.selfDeaf}\n\
    `) + colors.blue(`Old camera share state : `) + (`${oldVoiceState.selfVideo}\n\
    `) + colors.blue(`New camera share state : `) + (`${newVoiceState.selfVideo}\n\
    `) + colors.blue(`Old stream state : `) + (`${oldVoiceState.streaming}\n\
    `) + colors.blue(`New stream state : `) + (`${newVoiceState.streaming}\n\
    `) + colors.cyan(`${new Date().toLocaleString()}\n`))
    


    const serverMuteField: APIEmbedField[] = [{name: "Server muted?", value: `\`\`\`md\n# Old ==> ${oldVoiceState.serverMute}\n> New ==> ${newVoiceState.serverMute}\`\`\``}]

    const serverDeafField: APIEmbedField[] = [{name: "Server deaf?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.serverDeaf}\n> New ==> ${newVoiceState.serverDeaf}\`\`\``}]

    const selfMuteField: APIEmbedField[] = [{name: "Self muted?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.selfMute}\n> New ==> ${newVoiceState.selfMute}\`\`\``}]

    const selfDeafField: APIEmbedField[] = [{name: "Self deaf?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.selfDeaf}\n> New ==> ${newVoiceState.selfDeaf}\`\`\``}]

    const cameraShareField: APIEmbedField[] = [{name: "Camera share?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.selfVideo}\n> New ==> ${newVoiceState.selfVideo}\`\`\``}]

    const streamingField: APIEmbedField[] = [{name: "Streaming?", value: `\n\`\`\`md\n# Old ==> ${oldVoiceState.streaming}\n> New ==> ${newVoiceState.streaming}\`\`\``}]

    const usersInVoiceChannelField: APIEmbedField[] = [{name: "Connected members count", value: `\`\`\`fix\n${voiceChannel.members.size}\n\`\`\``}]



    const embed = new EmbedBuilder()
    .setAuthor({name: `${voiceChannelUser.username}`, iconURL: `${voiceChannelUser.avatarURL()}`})
    .setTitle(`${voiceChannelInteraction}`)
    .setColor("DarkGold")
    .addFields([
        {name: "General infos", value: `\n\
        User : <@${voiceChannelUser.id}>\n\
        User ID : ${voiceChannelUser.id}\n\
        Channel name : <#${voiceChannel.id}>\n\
        Channel ID : ${voiceChannel.id}\n\
        Category name : ${voiceChannelCategory.name}\n\
        Category ID : ${voiceChannelCategory.id}`},
    ])
    .setFooter({text: `${new Date().toLocaleString()}`})

    console.log(oldVoiceState.serverMute, newVoiceState.serverMute)

    if (oldVoiceState.serverMute != newVoiceState.serverMute) embed.addFields(serverMuteField)

    if (oldVoiceState.serverDeaf != newVoiceState.serverDeaf) embed.addFields(serverDeafField)

    if (oldVoiceState.selfMute != newVoiceState.selfMute) embed.addFields(selfMuteField)

    if (oldVoiceState.selfDeaf != newVoiceState.selfDeaf) embed.addFields(selfDeafField)

    if (oldVoiceState.selfVideo != newVoiceState.selfVideo) embed.addFields(cameraShareField)

    if (oldVoiceState.streaming != newVoiceState.streaming) embed.addFields(streamingField)

    embed.addFields(usersInVoiceChannelField)

    logsChannel.send({embeds: [embed]})
}