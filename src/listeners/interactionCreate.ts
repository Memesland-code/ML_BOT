import { createLogEmbed } from "#discord/embeds.js"
import { getGuildLogChannel } from "#discord/logChannels.js"
import { handleRoleInteraction } from "#handlers/roleMenuHandler"
import { formatEventLog } from "#logging/logFormatter.js"
import { writeLog } from "#logging/logger.js"
import { Listener } from "@sapphire/framework"
import { CommandInteractionOption, Interaction } from "discord.js"

export class InteractionCreateListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'interactionCreate'
        })
    }

    public async run(interaction: Interaction): Promise<void>
    {
        //? Basic logging function
        this.logInteraction(interaction)


        //? Check for Message type components
        if (!interaction.isMessageComponent()) return

        const isSupportedComponent = interaction.isButton() || interaction.isStringSelectMenu()
        if (!isSupportedComponent) return

        const [namespace] = interaction.customId.split(':')

        switch (namespace)
        { 
            case 'role':
                await handleRoleInteraction(interaction)
                break
            //TODO case: 'ticket'
            default:
                break
        }
    }



    private async logInteraction(interaction: Interaction)
    { 
        // Ignore non-guild interactions or autocomplete interactions (prevent log spam)
        if (!interaction.inGuild() || interaction.isAutocomplete()) return

        const { guild, channel, user } = interaction
        if (!guild) return

        // Interaction specific data
        const interactionDetails = this.getInteractionDetails(interaction)

        const channelName = channel && 'name' in channel ? channel.name : 'Unknown channel'
        const categoryName = channel && 'parent' in channel && channel.parent ? channel.parent.name : 'None'
        const categoryId = channel && 'parent' in channel && channel.parent ? channel.parent.id : 'None'

        // Console log
        const logString = formatEventLog({
            eventName: `Interaction created (${interactionDetails.type})`,
            guildName: guild.name,
            guildId: guild.id,
            severity: 'low',
            executor: { name: user.username, id: user.id },
            details: {
                Type: interactionDetails.type,
                Identifier: interactionDetails.identifier,
                Channel: channelName,
                'Channel ID': interaction.channelId ?? 'Unknown',
                CategoryName: categoryName,
                CategoryId: categoryId,
                Payload: interactionDetails.summary
            }
        })

        await writeLog(logString)

        // Discord log
        const logsChannel = await getGuildLogChannel(guild, 'standard')
        if (!logsChannel) return

        const hasPayload = interactionDetails.summary === 'No argument provided' ? 'fix' : 'yaml'

        const embed = createLogEmbed({
            title: `Interaction created: ${interactionDetails.type}`,
            color: 'LightGrey',
            executor: user,
            fields: [
                {
                    name: 'Location details',
                    value: [
                        `**User:** <@${user.id}> (${user.id})`,
                        `**Channel:** <#${interaction.channelId}> (${interaction.channelId})`,
                        `**Category:** ${categoryName} (${categoryId})`
                    ].join('\n')
                },
                {
                    name: 'Interaction info',
                    value: [
                        `**Type:** ${interactionDetails.type}`,
                        `**ID / Name:** \`${interactionDetails.identifier}\``
                    ].join('\n')
                },
                {
                    name: 'Full payload',
                    value: `\`\`\`${hasPayload}\n${interactionDetails.identifier} ${interactionDetails.summary}\n\`\`\``
                }
            ]
        })

        await logsChannel.send({ embeds: [embed] })
    }



    private getInteractionDetails(interaction: Interaction): { type: string, identifier: string, summary: string }
    {
        if (interaction.isChatInputCommand())
        {
            const optionsString = this.formatOptions(interaction.options.data)
            return {
                type: 'Slash command',
                identifier: `/${interaction.commandName}`,
                summary: optionsString || 'No argument provided'
            }
        }

        if (interaction.isContextMenuCommand())
        {
            return {
                type: 'Context menu',
                identifier: interaction.commandName,
                summary: `Target ID: ${interaction.targetId}`
            }
        }

        if (interaction.isButton())
        {
            const component = interaction.component
            const label = 'label' in component ? component.label : null
            const emoji = 'emoji' in component && component.emoji ? component.emoji.name : null

            return {
                type: 'Button',
                identifier: interaction.customId,
                summary: `Label: ${label ?? 'None'}\nEmoji: ${emoji ?? 'None'}`
            }
        }

        if (interaction.isAnySelectMenu())
        {
            return {
                type: 'Select menu',
                identifier: interaction.customId,
                summary: `Selected values:\n- ${interaction.values.join('\n- ')}`
            }
        }

        if (interaction.isModalSubmit())
        {
            const fieldsData = Array.from(interaction.fields.fields.values()).map((field) =>
            {
                if ('value' in field)
                {
                    return `${field.customId}: ${field.value}`
                }
                if ('values' in field && Array.isArray(field.values))
                {
                    return `${field.customId}: [${field.values.join(', ')}]`
                }
                return `${field.customId}: (No direct text value)`
            })

            return {
                type: 'Modal submit',
                identifier: interaction.customId,
                summary: fieldsData.join('\n') || 'No field data'
            }
        }

        return {
            type: 'Unknown interaction',
            identifier: 'N/A',
            summary: `Type ID: ${interaction.type}`
        }
    }



    private formatOptions(options: readonly CommandInteractionOption[]): string
    {
        return options.map((opt) =>
        {
            if (opt.options && opt.options.length > 0)
            {
                return `${opt.name}:\n  ${this.formatOptions(opt.options)}`
            }
            return `${opt.name}: ${opt.value}`
        }).join('\n')
    }
}