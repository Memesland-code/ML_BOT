import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { AuditLogEvent, Guild, GuildDefaultMessageNotifications, GuildExplicitContentFilter, GuildMFALevel, GuildVerificationLevel } from "discord.js"

export class GuildUpdateListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'guildUpdate'
        })
    }

    public async run(oldGuild: Guild, newGuild: Guild): Promise<void>
    {
        const auditEntry = await this.fetchAuditLog(newGuild)
        const executor = auditEntry?.executor ?? null
        const reason = auditEntry?.reason ?? null

        const changes: { name: string, value: string, inline?: boolean }[] = []
        const logDetails: Record<string, string> = {}


        //* 1. Server name
        if (oldGuild.name !== newGuild.name)
        {
            changes.push(
                { name: 'Old name', value: oldGuild.name, inline: true },
                { name: 'New name', value: newGuild.name, inline: true }
            )
            logDetails['Old name'] = oldGuild.name
            logDetails['New name'] = newGuild.name
        }

        //* 2. Description
        if (oldGuild.description !== newGuild.description)
        {
            changes.push(
                { name: 'Old description', value: oldGuild.description ?? '*None*', inline: true },
                { name: 'New description', value: newGuild.description ?? '*None*', inline: true }
            )
            logDetails['Old description'] = oldGuild.description ?? 'None'
            logDetails['New descritpion'] = newGuild.description ?? 'None'
        }

        //* 3. Server owner
        if (oldGuild.ownerId !== newGuild.ownerId)
        {
            changes.push(
                { name: 'Previous owner', value: `<@${oldGuild.ownerId}> (${oldGuild.ownerId})`, inline: true },
                { name: 'New owner', value: `<@${newGuild.ownerId}> (${newGuild.ownerId})`, inline: true }
            )
            logDetails['Previous owner ID'] = oldGuild.ownerId
            logDetails['New owner ID'] = newGuild.ownerId
        }

        //* 4. Server icon
        if (oldGuild.icon !== newGuild.icon)
        {
            const iconDiff = `\`\`\`diff\n- Old: ${oldGuild.iconURL() ?? 'None'}\n+ New: ${newGuild.iconURL() ?? 'None'}\n\`\`\``
            changes.push({ name: 'Icon changed', value: iconDiff })
            logDetails['Icon'] = `Old: ${oldGuild.iconURL()}\nNew: ${newGuild.iconURL()}`
        }

        //* 5. Server banner
        if (oldGuild.banner !== newGuild.banner)
        {
            const bannerDiff = `\`\`\`diff\n- Old: ${oldGuild.bannerURL() ?? 'None'}\n+ New: ${newGuild.bannerURL() ?? 'None'}\n\`\`\``
            changes.push({ name: 'Banner changed', value: bannerDiff })
            logDetails['Banner'] = `Old: ${oldGuild.bannerURL()}\nNew: ${newGuild.bannerURL()}`
        }

        //* 6. Splash image (invite splash)
        if (oldGuild.splash !== newGuild.splash)
        {
            const splashDiff = `\`\`\`diff\n- Old: ${oldGuild.splashURL() ?? 'None'}\n+ New: ${newGuild.splashURL() ?? 'None'}\n\`\`\``
            changes.push({ name: 'Splash Image Changed', value: splashDiff })
            logDetails['Splash'] = `Old: ${oldGuild.splashURL()}\nNew: ${newGuild.splashURL()}`
        }

        //* 7. Verification level
        if (oldGuild.verificationLevel !== newGuild.verificationLevel)
        {
            changes.push(
                { name: 'Old verification level', value: GuildVerificationLevel[oldGuild.verificationLevel], inline: true },
                { name: 'New verification level', value: GuildVerificationLevel[newGuild.verificationLevel], inline: true }
            )
            logDetails['Old verification'] = GuildVerificationLevel[oldGuild.verificationLevel]
            logDetails['New verification'] = GuildVerificationLevel[newGuild.verificationLevel]
        }

        //* 8. Explicit content filter
        if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter)
        {
            changes.push(
                { name: 'Old content filter', value: GuildExplicitContentFilter[oldGuild.explicitContentFilter], inline: true },
                { name: 'New content filter', value: GuildExplicitContentFilter[newGuild.explicitContentFilter], inline: true }
            )
            logDetails['Old content filter'] = GuildExplicitContentFilter[oldGuild.explicitContentFilter]
            logDetails['New content filter'] = GuildExplicitContentFilter[newGuild.explicitContentFilter]
        }

        //* 9. Default message notifications
        if (oldGuild.defaultMessageNotifications !== newGuild.defaultMessageNotifications)
        {
            changes.push(
                { name: 'Old notification setting', value: GuildDefaultMessageNotifications[oldGuild.defaultMessageNotifications], inline: true },
                { name: 'New notification setting', value: GuildDefaultMessageNotifications[newGuild.defaultMessageNotifications], inline: true }
            )
            logDetails['Old notifications'] = GuildDefaultMessageNotifications[oldGuild.defaultMessageNotifications]
            logDetails['New notifications'] = GuildDefaultMessageNotifications[newGuild.defaultMessageNotifications]
        }

        //* 10. 2FA moderation level
        if (oldGuild.mfaLevel !== newGuild.mfaLevel)
        {
            changes.push(
                { name: 'Old 2FA level', value: GuildMFALevel[oldGuild.mfaLevel], inline: true },
                { name: 'New 2FA level', value: GuildMFALevel[newGuild.mfaLevel], inline: true }
            )
            logDetails['Old 2FA level'] = GuildMFALevel[oldGuild.mfaLevel]
            logDetails['New 2FA level'] = GuildMFALevel[newGuild.mfaLevel]
        }

        //* 11. AFK channel
        if (oldGuild.afkChannelId !== newGuild.afkChannelId)
        {
            changes.push(
                { name: 'Old AFK channel', value: oldGuild.afkChannelId ? `<#${oldGuild.afkChannelId}>` : '*None*', inline: true },
                { name: 'New AFK channel', value: newGuild.afkChannelId ? `<#${newGuild.afkChannelId}>` : '*None*', inline: true }
            )
            logDetails['Old AFK channel ID'] = oldGuild.afkChannelId ?? 'None'
            logDetails['New AFK channel ID'] = newGuild.afkChannelId ?? 'None'
        }

        //* 12. AFK timeout
        if (oldGuild.afkTimeout !== newGuild.afkTimeout)
        {
            changes.push(
                { name: 'Old AFK timeout', value: `${oldGuild.afkTimeout / 60} minutes`, inline: true },
                { name: 'New AFK timeout', value: `${newGuild.afkTimeout / 60} minutes`, inline: true }
            )
            logDetails['Old AFK timeout'] = `${oldGuild.afkTimeout / 60}m`
            logDetails['New AFK timeout'] = `${newGuild.afkTimeout / 60}m`
        }

        //* 13. System channel
        if (oldGuild.systemChannelId !== newGuild.systemChannelId)
        {
            changes.push(
                { name: 'Old system channel', value: oldGuild.systemChannelId ? `<#${oldGuild.systemChannelId}>` : '*None*', inline: true },
                { name: 'New system channel', value: newGuild.systemChannelId ? `<#${newGuild.systemChannelId}>` : '*None*', inline: true }
            )
            logDetails['Old system channel ID'] = oldGuild.systemChannelId ?? 'None'
            logDetails['New system channel ID'] = newGuild.systemChannelId ?? 'None'
        }

        //* 14. Vanity URL
        if (oldGuild.vanityURLCode !== newGuild.vanityURLCode)
        {
            changes.push(
                { name: 'Old vanity code', value: oldGuild.vanityURLCode ?? '*None*', inline: true },
                { name: 'New vanity code', value: newGuild.vanityURLCode ?? '*None*', inline: true }
            )
            logDetails['Old vanity'] = oldGuild.vanityURLCode ?? 'None'
            logDetails['New vanity'] = newGuild.vanityURLCode ?? 'None'
        }

        //* 15. Preferred locale
        if (oldGuild.preferredLocale !== newGuild.preferredLocale)
        {
            changes.push(
                { name: 'Old locale', value: oldGuild.preferredLocale, inline: true },
                { name: 'New locale', value: newGuild.preferredLocale, inline: true }
            )
            logDetails['Old locale'] = oldGuild.preferredLocale
            logDetails['New locale'] = newGuild.preferredLocale
        }

        // If no tracked property modified: return early
        if (changes.length === 0) return

        // Console log
        const logString = formatEventLog({
            eventName: 'Server settings updated',
            guildName: newGuild.name,
            guildId: newGuild.id,
            severity: 'medium',
            executor: executor ? { name: executor.username, id: executor.id } : undefined,
            details: logDetails
        })

        await writeLog(logString)

        // Discord log
        const logsChannel = await getGuildLogChannel(newGuild, 'standard')
        if (!logsChannel) return

        const fields = [
            ...changes,
            {
                name: 'Executor',
                value: executor ? `User: <@${executor.id}>\nID: ${executor.id}` : 'Unknown'
            }
        ]

        if (reason)
        {
            fields.push({
                name: 'Reason',
                value: `\`\`\`fix\n${reason}\n\`\`\``
            })
        }

        const embed = createLogEmbed({
            title: 'Server settings updated',
            color: 'DarkOrange',
            executor,
            fields
        })

        await logsChannel.send({ embeds: [embed] })
    }


    private async fetchAuditLog(guild: Guild)
    {
        const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.GuildUpdate })

        const entry = auditLogs?.entries.first()
        if (!entry) return null

        const isRecent = entry.createdTimestamp > Date.now() - 10000
        return isRecent ? entry : null
    }
}