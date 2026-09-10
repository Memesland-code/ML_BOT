import { Command } from "@sapphire/framework"
import { ActionRowBuilder, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js"

export class EventCommand extends Command
{
    public constructor(context: Command.LoaderContext, options: Command.Options)
    {
        super(context, {
            ...options,
            name: 'event',
            description: 'Gestion des événements',
            preconditions: ['GuildOnly', 'ModeratorsOnly', 'IsUnderDevelopment'],
        })
    }

    public override registerApplicationCommands(registry: Command.Registry)
    { 
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand((cmd) =>
                    cmd
                        .setName('create')
                        .setDescription('Créer un nouvel événement')
                        .addRoleOption((o) =>
                            o
                                .setName('required_roles')
                                .setDescription('Rôle(s) filtrés pour participer à l\'événement')
                                .setRequired(false)
                    )
                        .addRoleOption((o) =>
                            o
                                .setName('co_organizers')
                                .setDescription('Co-organisateur(s) de l\'événement')
                                .setRequired(false)
                        )
                )
        )
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction)
    { 
        const subCommand = interaction.options.getSubcommand()

        if (subCommand === 'create') await this.handleCreateEvent(interaction)
    }

    private async handleCreateEvent(interaction: Command.ChatInputCommandInteraction): Promise<void>
    { 
        const requiredRoles = interaction.options.getRole('required_roles')
        const coOrganizers = interaction.options.getMember('co_organizers') as GuildMember

        const modalCustomId = `event_create_modal:${requiredRoles?.id ?? 'none'}:${coOrganizers?.id ?? 'none'}`

        const titleInput = new TextInputBuilder({
            customId: 'event_title',
            label: 'Titre de l\'événement',
            style: TextInputStyle.Short,
            placeholder: 'ex: Soirée sur Garry\'s Mod',
            required: true,
            maxLength: 255
        });

        const dateInput = new TextInputBuilder({
            customId: 'event_date',
            label: 'Date et Heure au format `DD/MM/YYYY HH:mm`',
            style: TextInputStyle.Short,
            placeholder: 'ex: 15/09/2026 21:00',
            required: true,
            maxLength: 16
        });

        const descInput = new TextInputBuilder({
            customId: 'event_description',
            label: 'Description / Détails',
            style: TextInputStyle.Paragraph,
            placeholder: 'Détails de l\'événement, prérequis, etc.',
            required: false
        });

        const playersInput = new TextInputBuilder({
            customId: 'event_players',
            label: 'Nombre de joueurs Min/Max OU Min',
            style: TextInputStyle.Short,
            placeholder: 'Format: Min/Max OU Min | ex. 4/8 ou 5',
            required: false
        });

        const modal = new ModalBuilder({
            customId: modalCustomId,
            title: 'Créer un événement',
            components: [
                new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
                new ActionRowBuilder<TextInputBuilder>().addComponents(playersInput)
            ]
        });

        await interaction.showModal(modal);

        /*
        TODO check for error on command sent
        TODO Check next steps: https://github.com/Memesland-code/ML_BOT/issues/19
        */
    }
}