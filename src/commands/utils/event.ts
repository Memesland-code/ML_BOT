import { Command } from "@sapphire/framework"
import { LabelBuilder, ModalBuilder, TextInputStyle } from "discord.js"

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
                        .addBooleanOption((o) =>
                            o
                                .setName('show_debug')
                                .setDescription('Afficher publiquement les rôles requis et co-organisateurs sur l\'événement')
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
        const showDebug = interaction.options.getBoolean('show_debug') ?? false

        const modalCustomId = `event_create_modal:${showDebug}`


        const titleLabel = new LabelBuilder()
            .setLabel("Titre de l'événement")
            .setTextInputComponent((comp) =>
                comp
                    .setCustomId('event_title')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("ex: Soirée sur Garry's Mod")
                    .setRequired(true)
                    .setMaxLength(255)
            )


        const dateLabel = new LabelBuilder()
            .setLabel("Date et Heure au format DD/MM/YYYY HH:mm")
            .setTextInputComponent((comp) =>
                comp
                    .setCustomId('event_date')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("ex: 15/09/2026 21:00")
                    .setRequired(true)
                    .setMaxLength(16)
            )


        const descriptionLabel = new LabelBuilder()
            .setLabel("Description / Détails")
            .setTextInputComponent((comp) =>
                comp
                    .setCustomId('event_description')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder("Détails de l'événement, prérequis, etc.")
                    .setRequired(false)
            )


        const playersLabel = new LabelBuilder()
            .setLabel("Nombre de joueurs Min/Max OU Min")
            .setTextInputComponent((comp) =>
                comp
                    .setCustomId('event_players')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("Format: Min/Max OU Min | ex. 4/8 ou 5")
                    .setRequired(false)
            )


        const latecomersLabel = new LabelBuilder()
            .setLabel("Autoriser les arrivées tardives ?")
            .setRadioGroupComponent((radioGroup) =>
                radioGroup
                    .setCustomId('event_latecomers')
                    .addOptions([
                        { label: '🟢 Autoriser', value: 'true', default: true },
                        { label: '🔴 Ne pas autoriser', value: 'false' }
                    ])
            .setRequired(true)
            )


        const modal = new ModalBuilder()
            .setCustomId(modalCustomId)
            .setTitle('Créer un événement (1/2)')
            .addLabelComponents(titleLabel, dateLabel, descriptionLabel, playersLabel, latecomersLabel)

        await interaction.showModal(modal);
    }
}