import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { GuildMember } from "discord.js"

export class GuildMemberAddListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'guildMemberAdd'
        })
    }

    public async run(member: GuildMember): Promise<void>
    {
        const guild = member.guild
        if (!guild) return

        // Account date & age calculation
        const createdAt = member.user.createdAt
        const createdTimestamp = Math.floor(createdAt.getTime() / 1000)
        const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000)
        const totalMembers = guild.memberCount

        // Console log
        const logString = formatEventLog({
            eventName: 'New member joined server',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'low',
            details: {
                'User username': member.user.username,
                'User ID': member.user.id,
                'Account age': `${accountAgeDays} days`,
                'Account creation date': createdAt.toLocaleString(),
                'Server members count': `${totalMembers}`
            }
        })

        await writeLog(logString)

        // Discord log
        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        const embedd = createLogEmbed({
            title: 'New member joined server',
            color: 'Green',
            author: {
                name: member.user.username,
                iconURL: member.user.displayAvatarURL()
            },
            fields: [
                {
                    name: 'User infos',
                    value: `User: ${member.user.id}\nID: ${member.user.id}`
                },
                {
                    name: 'Account age',
                    value: `${accountAgeDays} days ago (<t:${createdTimestamp}:R>)`
                },
                {
                    name: 'Account creation date',
                    value: `<t:${createdTimestamp}:F>`
                },
                {
                    name: 'Server members count',
                    value: `${totalMembers}`
                }
            ]
        })

        await logsChannel.send({ embeds: [embedd] })
    }
}