import { getAuditLogExecutor } from "#discord/auditLogs.js"
import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, Role } from "discord.js"

export class RoleCreateListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'roleCreate'
        })
    }

    public async run(role: Role): Promise<void>
    {
        const guild = role.guild

        const executor = await getAuditLogExecutor(guild, AuditLogEvent.RoleCreate, role.id)

        // Console log
        const logString = formatEventLog({
            eventName: 'Role created',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'medium',
            executor: executor ? { name: executor.username, id: executor.id } : undefined,
            details: {
                'Role ID': role.id
            }
        })

        await writeLog(logString)


        // Discord log
        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        const embed = createLogEmbed({
            title: 'Role created',
            color: 'Green',
            executor: executor ?? undefined,
            fields: [
                {
                    name: 'Role Details',
                    value: `**Role:** <@&${role.id}>\n**ID:** \`${role.id}\``
                },
                {
                    name: 'Created by',
                    value: executor ? `<@${executor.id}> (${executor.username})` : 'Unknown / API'
                }
            ]
        })

        await logsChannel.send({ embeds: [embed] })
    }
}