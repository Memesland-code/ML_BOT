import { Command } from "@sapphire/framework"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, ComponentType, EmbedBuilder, MessageActionRowComponentBuilder, parseEmoji, PermissionFlagsBits, Role, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextChannel } from "discord.js"



//* ========== Security ==========



const SENSITIVE_PERMISSIONS = [
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.ModerateMembers,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.ManageWebhooks
]



function isRoleSafe(role: Role, botHighestRole: Role): { safe: boolean; reason?: string }
{ 
    if (role.managed) return { safe: false, reason: "Le rôle est géré par une intégration externe (Bot, Twitch, Booster, etc...)" }
    if (role.permissions.any(SENSITIVE_PERMISSIONS)) return { safe: false, reason: "Le rôle possède des permissions administratives ou de modération sensibles." }
    if (role.position >= botHighestRole.position) return {safe: false, reason: "Le rôle est placé au-dessus ou au même niveau que le plus haut rôle du bot dans la hiérarchie du serveur."}

    return { safe: true }
}



//* ========== Core Command ==========



export class RoleMenuCommand extends Command
{ 
    public constructor(context: Command.LoaderContext, options: Command.Options)
    { 
        super(context, {
            ...options,
            name: 'rolemenu',
            description: 'Gère les menus dynamiques d\'attribution de rôles',
            preconditions: ['GuildOnly', 'ModeratorsOnly'],
            requiredClientPermissions: [PermissionFlagsBits.ManageRoles]
        })
    }

    public override registerApplicationCommands(registry: Command.Registry)
    { 
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)

            // --- SUBCOMMAND: SETUP ---
                .addSubcommand((cmd) =>
                    cmd
                        .setName('setup')
                        .setDescription('Crée le conteneur du menu de rôles')
                        .addStringOption((o) =>
                            o
                                .setName('type')
                                .setDescription('Format interactif du menu')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'Boutons (max 25)', value: 'BUTTONS' },
                                    { name: 'Menu déroulant (choix unique)', value: 'SELECT_SINGLE' },
                                    { name: 'Menu déroulant (choix multiple)', value: 'SELECT_MULTI' }
                                )
                        )
                        .addStringOption((o) => o.setName('title').setDescription('Titre de l\'embed'))
                        .addStringOption((o) => o.setName('description').setDescription('Description de l\'embed'))
                        .addChannelOption((o) => o.setName('channel').setDescription('Salon cible').addChannelTypes(ChannelType.GuildText))
                )

            // --- SUBCOMMAND: ADD
                .addSubcommand((cmd) =>
                    cmd
                        .setName('add')
                        .setDescription('Ajoute un rôle à un menu existant')
                        .addStringOption((o) => o.setName('message_id').setDescription('ID du message du bot').setRequired(true))
                        .addRoleOption((o) => o.setName('role').setDescription('Le rôle à ajouter').setRequired(true))
                        .addStringOption((o) => o.setName('emoji').setDescription('Emoji à afficher (optionnel)'))
                        .addStringOption((o) => o.setName('label').setDescription('Texte personnalisé (nom du rôle par défaut)'))
                )

            // --- SUBCOMMAND: REMOVE
                .addSubcommand((cmd) =>
                    cmd
                        .setName('remove')
                        .setDescription('Retire un rôle d\'un menu existant')
                        .addStringOption((o) => o.setName('message_id').setDescription('ID du message du bot').setRequired(true))
                        .addRoleOption((o) => o.setName('role').setDescription('Le rôle à retirer').setRequired(true))
                )
        )
    }



    public async chatInputRun(interaction: ChatInputCommandInteraction)
    {
        const subcommand = interaction.options.getSubcommand()

        switch (subcommand)
        { 
            case 'setup': return this.handleSetup(interaction)
            case 'add': return this.handleAdd(interaction)
            case 'remove': return this.handleRemove(interaction)
            default: return interaction.reply({ content: 'Commande invalide', flags: ["Ephemeral"] })
        }
    }



    //? SETUP
    private async handleSetup(interaction: ChatInputCommandInteraction)
    { 
        const type = interaction.options.getString('type', true)
        const title = interaction.options.getString('title') ?? '🎭 Attribution des rôles'
        const description = interaction.options.getString('description') ?? 'Utilisez les composants ci-dessous pour gérer vos rôles'

        const channelOption = (interaction.options.getChannel('channel'))
        const channel = channelOption ? interaction.guild!.channels.cache.get(channelOption.id) as TextChannel : (interaction.channel as TextChannel)

        if (!channel || !channel.isTextBased) return interaction.reply({ content: "❌ Le channel spécifié n'est pas un channel textuel valide.", flags: ["Ephemeral"] })


        const typeLabels: Record<string, string> = {
            BUTTONS: 'Sélection par bouton',
            SELECT_SINGLE: 'Sélection unique parmi la liste',
            SELECT_MULTI: 'Sélection multiple parmi la liste'
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor('Blurple')
            .addFields({
                name: "Type de menu",
                value: typeLabels[type] ?? `Sélection inconnue`
            })
            .setFooter({ text: "Système de rôles dynamique" })

        const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = []

        // Creating stateless placeholder to keep type in memory without DB required
        if (type === 'BUTTONS')
        {
            const btn = new ButtonBuilder()
                .setCustomId('role:placeholder')
                .setLabel('En attente de configuration...')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)

            rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(btn))
        }
        else
        { 
            const selectId = type === 'SELECT_SINGLE' ? 'role:select:single' : 'role:select:multi'
            const select = new StringSelectMenuBuilder()
                .setCustomId(selectId)
                .setPlaceholder('Configuration en cours...')
                .setDisabled(true)
                .addOptions(new StringSelectMenuOptionBuilder()
                    .setLabel('Placeholder')
                    .setValue('placeholder'))

            rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(select))
        }

        const msg = await channel.send({ embeds: [embed], components: rows })
        return interaction.reply({ content: `✅ Menu créé avec succès dans <#${channel.id}> !\nMessage : https://discord.com/channels/${interaction.guild?.id}/${channel.id}/${msg.id} (\`${msg.id}\`)`, flags: ["Ephemeral"]})
    }



    //? ADD
    private async handleAdd(interaction: ChatInputCommandInteraction)
    { 
        await interaction.deferReply({ flags: ["Ephemeral"] })

        const messageId = interaction.options.getString('message_id', true)
        const role = interaction.options.getRole('role', true) as Role
        const label = interaction.options.getString('label') ?? role.name

        const emoji = interaction.options.getString('emoji')
        let formattedEmoji: ReturnType<typeof parseValidEmoji> = null

        if (emoji)
        { 
            formattedEmoji = parseValidEmoji(emoji)
            if (!formattedEmoji) return interaction.editReply("❌ L'emoji fourni est invalide. Utilisez un emoji Unicode standard ou un emoji personnalisé présent sur le serveur.")
        }

        // Secutiry checks
        const botmember = await interaction.guild!.members.fetchMe()
        const safetyCheck = isRoleSafe(role, botmember.roles.highest)
        if (!safetyCheck.safe) return interaction.editReply(`❌ Ajout refusé : ${safetyCheck.reason}`)

        // Message fetch
        const channel = interaction.channel as TextChannel
        const message = await channel.messages.fetch(messageId).catch(() => null)
        if (!message || message.author.id !== interaction.client.user.id) return interaction.editReply("❌ Message introuvable ou celui-ci n'appartient pas au bot.")

        // Analyze the message to know its type and components
        const firstRow = message.components[0]
        if (!firstRow) return interaction.editReply("❌ Ce message ne semble pas être un role menu valide.")

        if (firstRow.type !== ComponentType.ActionRow) return interaction.editReply("❌ Format du message non valide. Merci de vérifier que l'ID correspond bien à un role menu.")

        const firstComponent = firstRow.components[0]
        if (!firstComponent) return interaction.editReply("❌ La ligne du menu est vide.")

        const customId = firstComponent.customId ?? ''
        if (!customId.startsWith('role:')) return interaction.editReply("❌ Ce message contient des composants mais n'est pas un role menu valide.")

        const isButton = firstComponent.type === ComponentType.Button


        //* Buttons Logic
        if (isButton)
        {
            // Extracting all current buttons ignoring placeholder
            const currentButtons: ButtonBuilder[] = []
            for (const row of message.components)
            {
                if (row.type !== ComponentType.ActionRow) return interaction.editReply("❌ Ce message ne semble pas être un role menu valide.")
                for (const btn of row.components)
                {
                    if (btn.type === ComponentType.Button && btn.customId !== 'role:placeholder')
                    {
                        currentButtons.push(ButtonBuilder.from(btn))
                    }
                }
            }

            // Limits and duplications checks
            if (currentButtons.some(b => 'custom_id' in b.data && b.data.custom_id === `role:btn:${role.id}`)) return interaction.editReply("❌ Ce rôle est déjà dans le menu.")
            if (currentButtons.length >= 25) return interaction.editReply("❌ Limite atteinte : 25 boutons maximum par message.")

            // New button creation
            const newBtn = new ButtonBuilder()
                .setCustomId(`role:btn:${role.id}`)
                .setLabel(label)
                .setStyle(ButtonStyle.Primary)


            if (formattedEmoji)
            { 
                try
                {
                    newBtn.setEmoji(formattedEmoji)     
                }
                catch (error)
                {
                    return interaction.editReply("❌ Impossible d'appliquer cet emoji au bouton.")
                }
            }

            currentButtons.push(newBtn)


            const newRows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = []
            for (let i = 0; i < currentButtons.length; i += 5)
            {
                const chunk = currentButtons.slice(i, i + 5)
                newRows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(chunk))
            }

            await message.edit({ components: newRows })
            return interaction.editReply(`✅ Rôle **${role.name}** ajouté en tant que bouton !`)
        }

        //* Select Menu Logic
        else if (firstComponent.type === ComponentType.StringSelect)
        { 
            const existingSelect = firstComponent
            const isMulti = existingSelect.customId === 'role:select:multi'

            // Extracting option ignoring placeholder
            const currentOptions = existingSelect.options
                .filter(opt => opt.value !== 'placeholder')
                .map(opt => StringSelectMenuOptionBuilder.from(opt))

            // Limits and duplications checks
            if (currentOptions.some(opt => opt.data.value === role.id)) return interaction.editReply("❌ Ce rôle est déjà dans le menu.")
            if (currentOptions.length >= 25) return interaction.editReply("❌ Limite atteinte : 25 options maximum par message.")

            const newOpt = new StringSelectMenuOptionBuilder()
                .setLabel(label)
                .setValue(role.id)

            if (formattedEmoji)
            { 
                try
                {
                    newOpt.setEmoji(formattedEmoji)    
                }
                catch (error)
                {
                    return interaction.editReply("❌ Impossible d'appliquer cet emoji à l'option du menu")
                }
            }

            
            currentOptions.push(newOpt)

            // Rebuilding select menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(existingSelect.customId)
                .setPlaceholder('Choisissez vos rôles...')
                .addOptions(currentOptions)
                .setMinValues(0)

            if (isMulti) selectMenu.setMaxValues(currentOptions.length) // Auto ajust max value
            else selectMenu.setMaxValues(1)

            const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(selectMenu)
            await message.edit({ components: [row] })
            return interaction.editReply(`✅ Rôle **${role.name}** ajouté au menu déroulant !`)
        }
    }



    //? REMOVE
    private async handleRemove(interaction: ChatInputCommandInteraction)
    { 
        await interaction.deferReply({ flags: "Ephemeral" })

        const messageId = interaction.options.getString('message_id', true)
        const role = interaction.options.getRole('role', true) as Role

        // Fetching target channel and message
        const channelOption = interaction.options.getChannel('channel')
        const channel = channelOption ? interaction.guild!.channels.cache.get(channelOption.id) as TextChannel : (interaction.channel as TextChannel)

        if (!channel || !channel.isTextBased) return interaction.editReply("❌ Channel non valide.")

        const message = await channel.messages.fetch(messageId).catch(() => null)
        if (!message || message.author.id !== interaction.client.user.id) return interaction.editReply("❌ Message introuvable ou celui-ci n'appartient pas au bot.")

        const firstRow = message.components[0] 
        if (!firstRow || firstRow.type !== ComponentType.ActionRow) return interaction.editReply("❌ Ce message n'est pas un role menu valide.")

        const firstComponent = firstRow.components[0]
        if (!firstComponent) return interaction.editReply("❌ La ligne du menu est vide.")

        const isButtons = firstComponent.type === ComponentType.Button


        //* Buttons Removal Logic


        if (isButtons)
        {
            let originalRoleButtonsCount = 0
            const remainingButtons: ButtonBuilder[] = []

            // Collect all buttons except the target role
            for (const row of message.components)
            {
                if (row.type === ComponentType.ActionRow)
                {
                    for (const component of row.components)
                    {
                        if (component.type === ComponentType.Button && component.customId !== 'role:placeholder')
                        {
                            originalRoleButtonsCount++

                            if (component.customId !== `role:btn:${role.id}`)
                            {
                                remainingButtons.push(ButtonBuilder.from(component))
                            }
                        }
                    }
                }
            }

            if (originalRoleButtonsCount === 0 || remainingButtons.length === originalRoleButtonsCount) return interaction.editReply("❌ Ce rôle n'a pas été trouvé dans le menu.")

            const newRows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = []

            // If no buttons are left, restore the default placeholder
            if (remainingButtons.length === 0)
            {
                const placeholderBtn = new ButtonBuilder()
                    .setCustomId('role:placeholder')
                    .setLabel("Configuration en cours...")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)

                newRows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(placeholderBtn))
            }
            else
            {
                // Re-pack remaining buttons into ActionRows (5 buttons max per row)
                for (let i = 0; i < remainingButtons.length; i += 5)
                {
                    const chunk = remainingButtons.slice(i, i + 5)
                    newRows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(chunk))
                }
            }

            await message.edit({ components: newRows })
            return interaction.editReply(`✅ Rôle **${role.name}** retiré de la liste de boutons !`)
        }


        //* Select Menu Removal Logic
        else if (firstComponent.type === ComponentType.StringSelect)
        { 
            const existingSelect = firstComponent
            const isMulti = existingSelect.customId === 'role:select:multi'

            // Filter the requested role ID
            const remainingOptions = existingSelect.options
                .filter(opt => opt.value !== 'placeholder' && opt.value !== role.id)
                .map(opt => StringSelectMenuOptionBuilder.from(opt))

            // Check if the role was removed
            const originalCount = existingSelect.options.filter(opt => opt.value !== 'placeholder').length
            if (remainingOptions.length === originalCount) return interaction.editReply("❌ Le rôle n'a pas été trouvé dans le menu déroulant.")

            const newRows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = []

            // If no options remain, restore the setup placeholder select menu
            if (remainingOptions.length === 0)
            {
                const placeholderSelect = new StringSelectMenuBuilder()
                    .setCustomId(existingSelect.customId)
                    .setPlaceholder("Configuration en cours...")
                    .setDisabled(true)
                    .addOptions(new StringSelectMenuOptionBuilder()
                        .setLabel('Placeholder')
                        .setValue('placeholder'))

                newRows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(placeholderSelect))
            }
            else
            { 
                // Rebuild the select menu with adjusted maxValues
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(existingSelect.customId!)
                    .setPlaceholder("Choisissez vos rôles...")
                    .addOptions(remainingOptions)
                    .setMinValues(0)

                // Dynamically shrink maxValues for multi-select
                if (isMulti)
                {
                    selectMenu.setMaxValues(remainingOptions.length)
                }
                else
                { 
                    selectMenu.setMaxValues(1)
                }

                newRows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(selectMenu))

                await message.edit({ components: newRows })
                return interaction.editReply(`✅ Rôle **${role.name}** retiré du menu déroulant !`)
            }

            return interaction.editReply("❌ Le composant sélectionné n'est pas supporté.")
        }
    }
}



const UNICODE_EMOJI_REGEX = /^(\p{Extended_Pictographic}|\p{Emoji_Component})+$/u

function parseValidEmoji(emojiInput: string)
{ 
    const trimmed = emojiInput.trim()
    const parsed = parseEmoji(trimmed)

    if (!parsed) return null

    if (parsed.id) return { id: parsed.id, name: parsed.name ?? undefined, animated: parsed.animated }

    if (parsed.name && UNICODE_EMOJI_REGEX.test(parsed.name)) return parsed.name

    return null
}