import { getAuditLogExecutor } from "#discord/auditLogs.js"
import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, Role } from "discord.js"

export class RoleUpddateListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'roleUpdate'
        })
    }

    public async run(oldRole: Role, newRole: Role): Promise<void>
    {
        const guild = newRole.guild
        if (!guild) return

        const changes: string[] = []
        const detailsObj: Record<string, string> = {}

        // Name check
        if (oldRole.name !== newRole.name)
        {
            changes.push(`**Name:** \`${oldRole.name}\` ➔ \`${newRole.name}\``)
            detailsObj['Name'] = `${oldRole.name} -> ${newRole.name}`
        }

        // Color check
        if (oldRole.hexColor !== newRole.hexColor)
        {
            changes.push(`**Color:** \`${oldRole.hexColor}\` ➔ \`${newRole.hexColor}\``)
            detailsObj['Color'] = `${oldRole.hexColor} -> ${newRole.hexColor}`
        }

        // Hoist check
        if (oldRole.hoist !== newRole.hoist)
        {
            changes.push(`**Hoisted:** ${oldRole.hoist ? 'Yes' : 'No'} ➔ ${newRole.hoist ? 'Yes' : 'No'}`)
            detailsObj['Hoisted'] = `${oldRole.hoist} -> ${newRole.hoist}`
        }

        // Mentionnable check
        if (oldRole.mentionable !== newRole.mentionable)
        {
            changes.push(`**Mentionable:** ${oldRole.mentionable ? 'Yes' : 'No'} ➔ ${newRole.mentionable ? 'Yes' : 'No'}`)
            detailsObj['Mentionable'] = `${oldRole.mentionable} -> ${newRole.mentionable}`
        }

        // Position check
        if (oldRole.position !== newRole.position)
        {
            changes.push(`**Position:** \`${oldRole.position}\` ➔ \`${newRole.position}\``)
            detailsObj['Position'] = `${oldRole.position} -> ${newRole.position}`
        }


        // Permissions diff calculation
        const addedPermissions = oldRole.permissions.missing(newRole.permissions)
        const removedPermissions = newRole.permissions.missing(oldRole.permissions)

        const permChangesFormatted: string[] = []

        if (addedPermissions.length > 0)
        {
            permChangesFormatted.push(`${addedPermissions.map(p => `+ ${p}`).join('\n')}`)
            detailsObj['Permissions added'] = '\n+ ' + addedPermissions.join('\n+ ')
        }

        if (removedPermissions.length > 0)
        {
            permChangesFormatted.push(`${removedPermissions.map(p => `- ${p}`).join('\n')}`)
            detailsObj['Permissions removed'] = '\n- ' + removedPermissions.join('\n- ')
        }

        if (changes.length === 0 && permChangesFormatted.length === 0) return

        const executor = await getAuditLogExecutor(guild, AuditLogEvent.RoleUpdate, newRole.id)

        // Console log
        const logString = formatEventLog({
            eventName: 'Role updated',
            guildName: guild.name,
            guildId: guild.id,
            severity: 'medium',
            executor: executor ? { name: executor.username, id: executor.id } : undefined,
            details: {
                'Role Name': newRole.name,
                'Role ID': newRole.id,
                ...detailsObj
            }
        })

        await writeLog(logString)

        // Discord log
        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        const fields = [
            {
                name: 'Role details',
                value: `Role: <@&${newRole.id}>\nID: ${newRole.id}`
            }
        ]

        if (changes.length > 0)
        {
            fields.push({
                name: 'General changes',
                value: changes.join('\n')
            })
        }

        if (permChangesFormatted.length > 0)
        {
            fields.push({
                name: 'Permission changes',
                value: `\`\`\`diff\n${permChangesFormatted.join('\n\n')}\n\`\`\``
            })
        }

        const embed = createLogEmbed({
            title: 'Role updated',
            color: 'Orange',
            executor,
            fields
        })

        await logsChannel.send({ embeds: [embed] })
    }
}