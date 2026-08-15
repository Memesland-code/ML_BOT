import { getAuditLogExecutor } from "#discord/auditLogs.js"
import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, Role } from "discord.js"

export class RoleDeleteListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, { event: 'roleDelete' })
    }

    public async run(role: Role): Promise<void>
    {
        const guild = role.guild

        const executor = await getAuditLogExecutor(guild, AuditLogEvent.RoleDelete, role.id)

        // Console log
        const logString = formatEventLog({
            eventName: 'Role deleted',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'medium',
            executor: executor ? { name: executor.username, id: executor.id } : undefined,
            details: {
                'Role Name': role.name,
                'Role ID': role.id
            }
        })

        await writeLog(logString)

        // Discord log
        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        const embed = createLogEmbed({
            title: 'Role deleted',
            color: 'Red',
            executor,
            fields: [
                {
                    name: 'Role Details',
                    value: `**Name:** ${role.name}\n**ID:** \`${role.id}\``
                },
                {
                    name: 'Deleted by',
                    value: executor ? `<@${executor.id}> (${executor.username})` : 'Unknown / API'
                }
            ]
        })

        await logsChannel.send({ embeds: [embed] })
    }
}