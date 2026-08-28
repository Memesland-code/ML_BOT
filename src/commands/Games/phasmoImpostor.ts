import { writeLog } from "#logging/logger.js"
import { Command } from "@sapphire/framework"
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType, ChatInputCommandInteraction, Client, ComponentType, EmbedBuilder, Message, MessageComponentInteraction, TextChannel, User } from "discord.js"



//* Scoring reminder
const rulesReminderEmbed = new EmbedBuilder()
    .setTitle("Phasmo imposteur - rappel des points")
    .setColor("DarkBlue")
    .setDescription("Résumé du Phasmo imposteur.\n4 joueurs sont envoyés en enquête comme à leur habitude, mais parmi eux se cache un imposteur.\nSon but ? Faire rater l'enquête et tuer les équipiers.\nLes équipiers vont devoir redoubler de vigilance et devront déterminer à qui ils peuvent accorder leur confiance et qui est l'imposteur pour le voter en fin de partie et survivre contre lui.\nLes parties durent 15 minutes + jusqu'à 10 minutes pour la phase de discussion et vote.\n\nCertaines actions rapportent des points, le but de chaque personne individuellement est de finir avec le plus de points.\n")
    .addFields(
        {
            name: "Relatif aux points - Pour l'imposteur",
            value: `
            Tuer une personne = 1 pt
            Activer une chasse maudite = 1 pt
            Tuer tout le monde = 1 pt bonus
            N'avoir aucun vote contre lui = 2 pts
            Si personne ne trouve le type de fantôme = 1 pt
            ⚠️ Trouver le fantôme ne fait **pas** gagner de points
            `
        },
        { name: '\u200b', value: '\u200b', },
        {
            name: "Relatif aux points - Pour les équipiers",
            value: `
            Trouver le type de fantôme = 1 pt
            Finir la partie en vie = 1 pt
            Finir la partie avec tous les équipiers en vie = 1 pt
            Voter contre l'imposteur = 1 pt
            ⚠️ Trouver le fantôme en étant mort ne fait **pas** gagner de points

            Photo 3 étoiles = 0.15 pts chacune
            Objectif secondaire validé = 0.5 pts chacun
            `
        },
        { name: '\u200b', value: '\u200b', },
        {
            name: "Règlement - Avant la partie",
            value: `
            Seul l'équipement de base est accepté + lampes puissantes et briquets (**A REVOIR - autoriser peut-être TOUS les équipements mais en T1 (sauf lampes)**)
            `
        },
        { name: '\u200b', value: '\u200b', },
        {
            name: "Règlement - Pendant la partie",
            value: `
            Il est strictement **interdit** de camper dans le camion ou en dehors du lieu hanté
               --> détail 1 : seuls les déplacements entre les 2 points sont autorisés
               --> détail 2 : le seul cas où il est autorisé de rester dehors est lors d'une chasse où il est impossible de rentrer. Suite à laquelle les joueurs devront obligatoirement entrer

            __Relatif à l'imposteur__
            Si l'imposteur meurt il ne le dit **pas** et la partie continue normalement
            Si la dernière personne en vie est l'imposteur, la partie prend fin directement
               --> Dans ce cas l'imposteur n'a pas le droit d'activer une chasse maudite pour gagner des points s'il ne l'a pas déjà fait
            `
        },
        { name: '\u200b', value: '\u200b', },
        {
            name: "Règlement - Phase de discussion & vote (= après les 15 minutes de jeu)",
            value: `
            Toutes les personnes en vie **DOIVENT** immédiatement quitter le lieu hanté
               --> Exception faite si une chasse est en cours, ou commence pendant la sortie des joueurs

            La phase de vote commence ensuite, elle se passe à **l'intérieur** du camion et dure **maximum** 10 minutes

            Les personnes en vie uniquement discutent dans la limite du temps et soumettent leur vote dès qu'il sont prêts contre celui qu'ils pensent être l'imposteur.
               --> Les personnes mortes n'ont ni le droit de parler aux vivants (possibilité de parler dans le voc des morts in-game), ni le droit de donner un vote

            Si les 10 minutes sont écoulées et que les personnes sont toujours en partie, elles doivent impérativement soumettre leur choix de vote final et quitter la partie

            ⚠️ Si tout le monde est mort, la phase de vote est skip
            `
        },
        { name: '\u200b', value: '\u200b', },
        {
            name: "Règlement - Après la partie",
            value: `
            L'imposteur est révélé depuis le message du bot et les points sont calculés
            `
        }
    )
    .setFooter({text: "Bonne chance à tous ! - Phasmo Imposteur v1.0"})



//? ==========  MESSAGES & ACTION ROWS CONSTANTS  ==========



//* Step 1 - Players setup
const step1_embed_playersSetup = new EmbedBuilder()
    .setTitle("Pré game - Choix des joueurs")
    .setColor("Yellow")
    .setFooter({ text: "Tips : Attention au son des notifs !" })

const step1_button = new ButtonBuilder()
    .setCustomId("goto_choosemap")
    .setLabel("Sélection de la map")
    .setStyle(ButtonStyle.Success)

const step1_row_playersSetup = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(step1_button)



//* Step 2 - Map setup
const step2_embed_mapSetup = new EmbedBuilder()
    .setTitle("Pré game - Choix de la map")
    .setColor("#FFF48D")
    .setFields({ name: "Map choisie", value: `\u200b` })    
    .setFooter({ text: "Tips : Apprenez la position des cachettes, objets maudits et autres qui pourraient vous aider durant votre enquête!" })

const step2_button = new ButtonBuilder()
    .setCustomId("goto_chooseimpostor")
    .setLabel("Choix de l'imposteur")
    .setStyle(ButtonStyle.Success)

const step2_row_mapSetup = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(step2_button)



//* Step 3 - Impostor setup
const step3_embed_impostorSetup = new EmbedBuilder()
    .setTitle("Pré game - Choix de l'imposteur")
    .setColor("Red")
    .setDescription("Un message a été envoyé à l'imposteur sélectionné\nVérifiez vos MP !")

//* Step 3.1 - Impostor message
const step3_1_embed_ImpostorMessage = new EmbedBuilder()
    .setTitle("Bonjour, imposteur !")
    .setColor("Purple")
    .setDescription("Vous avez été désigné imposteur pour cette partie.\nVeuillez cliquer sur le bouton pour informer que vous avez vu le message et passer à l'étape suivante.\nBonne chance et bonne chasse à vous !")
    .setFooter({ text: "Tips : Ne vous faites pas remarquer !" })

const step3_1_button = new ButtonBuilder()
    .setCustomId("imopstorConfirm")
    .setLabel("Valider")
    .setStyle(ButtonStyle.Success)

const step3_1_button_confirmed = new ButtonBuilder()
    .setCustomId("impostorconfirmed")
    .setLabel("Validé")
    .setStyle(ButtonStyle.Success)
    .setDisabled(true)

const step3_1_row_impostorMessage = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(step3_1_button)

const step3_1_confirmed_row_impostorMessage = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(step3_1_button_confirmed)



//* Step 4 - Waiting for game start
const step4_embed_startWait = new EmbedBuilder()
    .setTitle("Pré game - Attente du démarrage")
    .setColor("#98FB98")
    .setDescription("L'imposteur a été vérifié.\nPréparez-vous, la partie va bientôt commencer !\nRappel de la map : " + "none")

const step4_button = new ButtonBuilder()
    .setCustomId("startgame")
    .setLabel("Commencer")
    .setStyle(ButtonStyle.Success)

const step4_row_startWait = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(step4_button)



//* Step 5 - In game
let step5_embed_inGame = new EmbedBuilder()
    .setTitle("Game en cours...")
    .setColor("DarkBlue")
    .setFields({ name: "Temps restant", value: `\u200b` })

const step5_button = new ButtonBuilder()
    .setCustomId("goto_endgame")
    .setLabel("Finir la partie")
    .setStyle(ButtonStyle.Secondary)

const step_5_button_2 = new ButtonBuilder()
    .setCustomId("goto_impostorreveal_early")
    .setLabel("Révélation de l'imposteur")
    .setStyle(ButtonStyle.Danger)

const step5_row_inGame = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(step5_button, step_5_button_2)



//* Step 5.1 - In game - quitting haunted place (en game)
// Ici il faut un buffer d'attente entre la vraie fin de partie et le début du vote pour éviter de perdre du temps
const step5_1_embed_quitHaunted = new EmbedBuilder()
    .setTitle("Fin de la partie")
    .setColor("Aqua")
    .setDescription("A tous les survivants, merci de quitter **immédiatement** le lieu hanté.\nSi une chasse est en cours, vous devrez sortir dès la fin de celle-ci.\nLa partie est terminée, l'imposteur ne peut plus activer de chasse maudite.\n⚠️ Vous pouvez encore mourir !")
    .setFooter({text: "Tips : Commencez à réfléchir à qui est imposteur... Ou à comment cacher vos actes."})

const step5_1_button = new ButtonBuilder()
    .setCustomId("goto_votephase")
    .setLabel("Passer aux votes")
    .setStyle(ButtonStyle.Primary)

const step5_1_row_quitHaunted = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(step5_1_button)



//* Step 6 - Voting
const step6_embed_voting = new EmbedBuilder()
    .setTitle("Post game - Phase de vote")
    .setColor("#964B00")
    .setDescription("Vous avez 10 minutes **maximum** pour discuter entre vivants et voter chacun pour une personne.\nA l'issu de votre vote, sélectionnez une entité si ce n'est pas déjà fait et quittez la partie.\n\n⚠️ Restez en game pendant cette phase !")
    .setFooter({ text: "Tips : Réflechissez bien à ce qu'il s'est passé durant la partie" })

const step6_button = new ButtonBuilder()
    .setCustomId("goto_leavegame")
    .setLabel("Fin des votes")
    .setStyle(ButtonStyle.Success)

const step6_row_voting = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(step6_button)



//* Step 6.1 - Return to lobby
const step6_1_embed_returnLobby = new EmbedBuilder()
    .setTitle("Post game - Retour au lobby")
    .setColor("#964B00")
    .setDescription("La phase de vote est terminée. Merci de sélectionner un fantôme et de retourner au lobby")
    .setFooter({ text: "Tips : Avez-vous fait le bon choix ?" })

const step6_1_button = new ButtonBuilder()
    .setCustomId("goto_impostorreveal")
    .setLabel("Révélation de l'imposteur")
    .setStyle(ButtonStyle.Success)

const step6_1_row_returnLobby = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(step6_1_button)



//* Step 7 - Impostor reveal
const step7_embed_impostorReveal = new EmbedBuilder()
    .setTitle("Post game - Révélation de l'imposteur")
    .setColor("#000000")
    .setFields({ name: "L'imposteur était...", value: "???" })

const step7_button = new ButtonBuilder()
    .setCustomId("revealimpostor")
    .setLabel("Révéler l'imposteur")
    .setStyle(ButtonStyle.Danger)

const step7_row_impostorReveal = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(step7_button)



//* Step 7.1 - Impostor revealed
const step7_1_embed_impostorRevealed = new EmbedBuilder()
    .setTitle("Post game - Révélation de l'imposteur")
    .setColor("#000000")

const step7_1_button = new ButtonBuilder()
    .setCustomId("impostorrevealed")
    .setLabel("Imposteur révélé")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(true)

const step7_1_row_impostorRevealed = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(step7_1_button)



//? ========== INTERFACES & HELPERS ==========



interface PlayerDmStatus
{ 
    user: User
    canReceive: boolean   
}

interface DmCheckResult
{ 
    allCanReceive: boolean
    statuses: PlayerDmStatus[]
}


export async function checkUsersDmStatus(client: Client, userIds: string[]): Promise<DmCheckResult>
{ 
    const users = await Promise.all(userIds.map(id => client.users.fetch(id)))

    const results = await Promise.allSettled(
        users.map(async (user) =>
        { 
            const msg = await user.send('👻 *Vérification de la disponibilité des MP*')
            await msg.delete().catch(() => { })
            return user
        })
    )

    const statuses: PlayerDmStatus[] = results.map((result, index) => ({
        user: users[index],
        canReceive: result.status === 'fulfilled'
    }))

    return {
        allCanReceive: statuses.every(s => s.canReceive),
        statuses
    }
}

//* Game timeout embed
const timeoutError = new EmbedBuilder()
    .setTitle("Partie annulée")
    .setColor("Red")
    .setDescription("La partie a été annulée car aucune action n'a été effectuée après 5 minutes")


//* Impostor DM error
const dmError = new EmbedBuilder()
    .setTitle("Partie annulée")
    .setColor("Red")
    .setDescription("Un problème s'est produit lors du contact par MP de l'imposteur")



async function waitForButton(message: Message, filter: (i: MessageComponentInteraction) => boolean, time: number): Promise<ButtonInteraction | null>
{ 
    try
    {
        return await message.awaitMessageComponent({filter, componentType: ComponentType.Button, time}) as ButtonInteraction
    }
    catch (error)
    {
        return null
    }
}



//? ==========  GAME VARIABLES  ==========



enum GameStep
{ 
    PLAYERS = 'PLAYERS',
    MAP = 'MAP',
    IMPOSTOR_SELECT = 'IMPOSTOR_SELECT',
    IMPOSTOR_DM = 'IMPOSTOR_DM',
    SUMMARY = 'SUMMARY',
    IN_GAME = 'IN_GAME',
    QUITTING_HAUNTED = 'QUITTING_HAUNTED',
    VOTING = 'VOTING',
    RETURN_LOBBY = 'RETURN_LOBBY',
    REVEAL = 'REVEAL',
    END = 'END',
    TIMEOUT = 'TIMEOUT'
}

interface GameState
{ 
    step: GameStep
    interaction: ChatInputCommandInteraction
    channel: TextChannel
    hostId: string
    impostor: User
    chosenMap: string
    message?: Message
}

let smallMapsList = ["6 Tanglewood Drive", "42 Edgefield Road", "10 Ridgeview Court", "Nell's Diner", "Grafton Farmhouse", "13 Willow Street", "Point Hope Restricted", "Camp Woodwind"]

let mediumMapsList = ["Point Hope", "Brownstone High School Restricted", "Bleasdale Farmhouse", "Sunny Meadows Restricted", "Prison", "Maple Lodge Campsite"]

let largeMapsList = ["Brownstone High School", "Sunny Meadows"]

// Time in seconds
const gameTime = 900
const voteTime = 600
const baseWaitTime = 300





//? ==========  CORE COMMAND  ==========





export class PhasmoImpostorCommand extends Command
{ 
    public constructor(context: Command.LoaderContext, options: Command.Options)
    { 
        super(context, {
            ...options,
            name: 'phasmoImpostor',
            description: 'Lance le jeu Phasmo Imposteur',
            preconditions: ['GuildOnly', 'OwnersOnly']
        })
    }

    public override registerApplicationCommands(registry: Command.Registry)
    { 
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)

                // Subcommand launch game
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('start')
                        .setDescription("Lance Phasmo Imposteur")
                        .addUserOption((o) => o.setName("player1").setDescription("Joueur 1").setRequired(true))
                        .addUserOption((o) => o.setName("player2").setDescription("Joueur 2").setRequired(true))
                        .addUserOption((o) => o.setName("player3").setDescription("Joueur 3").setRequired(true))
                        .addUserOption((o) => o.setName("player4").setDescription("Joueur 4").setRequired(true))
                        .addBooleanOption((o) => o.setName("include_medium_maps").setDescription("Si les maps moyennes doivent être incluses dans la liste").setRequired(true))
                        .addBooleanOption((o) => o.setName("include_large_maps").setDescription("Si les grandes maps doivent être incluses dans la liste").setRequired(true))
                        .addBooleanOption((o) => o.setName("run_dm_test").setDescription("Si le jeu doit tester l'accès aux MP des joueurs au lancement"))
                )

                // Subcommand send rules reminder only
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("rules")
                        .setDescription("Envoie le rappel des règles")
                )
        )
    }



    public async chatInputRun(interaction: ChatInputCommandInteraction)
    { 
        const subcommand = interaction.options.getSubcommand()

        switch (subcommand)
        { 
            case 'start':
                return this.handleStart(interaction)
            case 'rules':
                return this.handleRules(interaction)
            default:
                return interaction.reply({ content: 'Commande invalide !', flags: ['Ephemeral'] })
        }
    }





    private async handleRules(interaction: ChatInputCommandInteraction)
    { 
        interaction.reply({ embeds: [rulesReminderEmbed] })
    }

    private async handleStart(interaction: ChatInputCommandInteraction)
    { 
        if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText)
        { 
            writeLog("[Phasmo impostor] Error while starting game. Please start the game in a Guild Text channel.", 'ERROR')
            return
        }

        await interaction.deferReply()

        const gameChannel = interaction.channel as TextChannel

        //* Map filling and selection
        let mapsList: string[] = [...smallMapsList]

        if (interaction.options.getBoolean("include_medium_maps", true)) mapsList.push(...mediumMapsList)
        if (interaction.options.getBoolean("include_large_maps", true)) mapsList.push(...largeMapsList)

        let chosenMap = mapsList[Math.floor(Math.random() * mapsList.length)] ?? mapsList[0]


        //* Getting players
        const playerIds = [
            interaction.options.getUser("player1", true).id,
            interaction.options.getUser("player2", true).id,
            interaction.options.getUser("player3", true).id,
            interaction.options.getUser("player4", true).id
        ]


        //* DM access check
        if (interaction.options.getBoolean("run_dm_test", false) == true)
        { 
            const dmStatus = await checkUsersDmStatus(interaction.client, playerIds)
            if (!dmStatus.allCanReceive)
            { 
                const statusList = dmStatus.statuses.map(s => `${s.canReceive ? '✅' : '❌'} <@${s.user.id}>`).join('\n')
    
                return interaction.editReply({
                    content: `Impossible de lancer la partie !\nCertains joueurs doivent autoriser les MP du serveur (Paramètres du serveur ➔ Confidentialité) :\n\n${statusList}`
                })
            }
        }


        //* Impostor selection
        const randomImpostorId = playerIds[Math.floor(Math.random() * playerIds.length)]
        const impostor: User = await interaction.client.users.fetch(randomImpostorId)


        //* Embeds filling
        step1_embed_playersSetup.setFields(
            { name: "Joueur 1", value: `<@${playerIds[0]}>` },
            { name: "Joueur 2", value: `<@${playerIds[1]}>` },
            { name: "Joueur 3", value: `<@${playerIds[2]}>` },
            { name: "Joueur 4", value: `<@${playerIds[3]}>` }
        )

        step2_embed_mapSetup.setFields({ name: "Map choisie", value: `\`${chosenMap}\`` })

        step4_embed_startWait.setDescription(`L'imposteur a été vérifié.\nPréparez-vous, la partie va bientôt commencer !\nRappel de la map : \`${chosenMap}\`\n\nLa partie se lance quand la porte d'entrée du lieu hanté s'ouvre.`)

        step7_1_embed_impostorRevealed.setFields({ name: "L'imposteur était...", value: `${impostor}` })

        dmError.setDescription(`La partie a été annulée car l'imposteur choisi ${impostor} n'a pas autorisé l'envoi de MP sur ce serveur.`)


        //* Initializing game state
        const state: GameState = {
            step: GameStep.PLAYERS,
            interaction,
            channel: gameChannel,
            hostId: interaction.user.id,
            impostor,
            chosenMap
        }

        const baseCollectorFilter = (i: MessageComponentInteraction) => i.user.id === state.hostId


        //? ========== STATE MACHINE LOOP ==========


        while (state.step !== GameStep.END && state.step != GameStep.TIMEOUT)
        { 
            switch (state.step)
            { 
                // --- STEP 1: Showing players and wait for map click ---
                case GameStep.PLAYERS: { 
                    state.message = await interaction.editReply({ embeds: [step1_embed_playersSetup], components: [step1_row_playersSetup] })

                    const btn = await waitForButton(state.message, baseCollectorFilter, baseWaitTime * 1000)
                    if (!btn)
                    { 
                        state.step = GameStep.TIMEOUT
                        break
                    }

                    if (btn.customId === "goto_choosemap")
                    { 
                        await btn.update({ embeds: [step2_embed_mapSetup], components: [step2_row_mapSetup] })
                        state.step = GameStep.MAP
                    }
                    break
                }

                // --- STEP 2: Map confirm ---
                case GameStep.MAP: { 
                    const btn = await waitForButton(state.message!, baseCollectorFilter, baseWaitTime * 1000)
                    if (!btn)
                    { 
                        state.step = GameStep.TIMEOUT
                        break
                    }

                    if (btn.customId === "goto_chooseimpostor")
                    { 
                        await btn.update({ embeds: [step3_embed_impostorSetup], components: [] })
                        state.step = GameStep.IMPOSTOR_DM
                    }
                    break
                }

                // --- STEP 3: Impostor DM and confirm ---
                case GameStep.IMPOSTOR_DM: { 
                    try
                    {
                        const impostorMSg = await state.impostor.send({ embeds: [step3_1_embed_ImpostorMessage], components: [step3_1_row_impostorMessage] })

                        const impostorBtn = await waitForButton(impostorMSg, (i) => i.user.id === state.impostor.id, baseWaitTime * 1000)

                        if (!impostorBtn)
                        { 
                            await state.message?.edit({ embeds: [dmError], components: [] })
                            state.step = GameStep.TIMEOUT
                            break
                        }

                        await impostorBtn.update({ embeds: [step3_1_embed_ImpostorMessage], components: [step3_1_confirmed_row_impostorMessage] })
                        await state.message?.edit({ embeds: [step4_embed_startWait], components: [step4_row_startWait] })

                        state.step = GameStep.SUMMARY
                    }
                    catch (error)
                    {
                        await state.message?.edit({ embeds: [dmError], components: [] })
                        state.step = GameStep.TIMEOUT
                    }
                }

                // --- STEP 4: Waiting for game launch ---
                case GameStep.SUMMARY: { 
                    const btn = await waitForButton(state.message!, baseCollectorFilter, baseWaitTime * 1000)
                    if (!btn)
                    { 
                        state.step = GameStep.TIMEOUT
                        break
                    }

                    if (btn.customId === "startgame")
                    { 
                        const gameEndTimestamp = Math.floor(Date.now() / 1000) + gameTime
                        step5_embed_inGame.setFields(
                            { name: "Heure exacte de fin", value: `<t:${gameEndTimestamp}:T>` },
                            { name: "Temps restant", value: `<t:${gameEndTimestamp}:R>` }
                        )

                        await btn.update({ embeds: [step5_embed_inGame], components: [step5_row_inGame] })
                        state.step = GameStep.IN_GAME
                    }
                    break
                }

                // --- STEP 5: In game (Game timer OR manual click if everyone dies) ---
                case GameStep.IN_GAME: { 
                    const btn = await waitForButton(state.message!, baseCollectorFilter, gameTime * 1000)

                    if (!btn)
                    {
                        // = Timeout after 15 minutes of game = end of game
                        await state.message?.edit({ embeds: [step5_1_embed_quitHaunted], components: [step5_1_row_quitHaunted] })
                        state.step = GameStep.QUITTING_HAUNTED

                        const playersPings = playerIds.map(id => `<@${id}>`).join(' ')
                        const msg = await state.channel.send(playersPings)
                        await msg.delete().catch(() => { })
                    }
                    else if (btn.customId === "goto_endgame")
                    {
                        await btn.update({ embeds: [step5_1_embed_quitHaunted], components: [step5_1_row_quitHaunted] })
                        state.step = GameStep.QUITTING_HAUNTED
                    }
                    else if (btn.customId === "goto_impostorreveal_early")
                    { 
                        await btn.update({ embeds: [step7_embed_impostorReveal], components: [step7_row_impostorReveal] })
                        state.step = GameStep.REVEAL
                    }
                    break
                }

                // --- STEP 5.1: Quitting haunted place ---
                case GameStep.QUITTING_HAUNTED: { 
                    const btn = await waitForButton(state.message!, baseCollectorFilter, baseWaitTime * 1000)

                    const voteEndTimestamp = Math.floor(Date.now() / 1000) + voteTime
                    step6_embed_voting.setFields(
                        { name: "Heure exacte de fin", value: `<t:${voteEndTimestamp}:T>` },
                        { name: "Temps restant pour voter", value: `<t:${voteEndTimestamp}:R>` }
                    )

                    if (!btn)
                    {
                        await state.message?.edit({ embeds: [step6_embed_voting], components: [step6_row_voting] })
                    }
                    else if (btn.customId === "goto_votephase")
                    { 
                        await btn.update({embeds: [step6_embed_voting], components: [step6_row_voting]})
                    }
                    state.step = GameStep.VOTING
                    break
                }

                // --- STEP 6: Voting phase ---
                case GameStep.VOTING: { 
                    const btn = await waitForButton(state.message!, baseCollectorFilter, voteTime * 1000)

                    if (!btn)
                    {
                        await state.message?.edit({ embeds: [step6_1_embed_returnLobby], components: [step6_1_row_returnLobby] })

                        const playersPings = playerIds.map(id => `<@${id}>`).join(' ')
                        const msg = await state.channel.send(playersPings)
                        await msg.delete().catch(() => { })
                    }
                    else if (btn.customId === "goto_leavegame")
                    { 
                        await btn.update({embeds: [step6_1_embed_returnLobby], components: [step6_1_row_returnLobby]})
                    }
                    state.step = GameStep.RETURN_LOBBY
                    break
                }

                // --- STEP 6.1: Return to lobby and transition to reveal ---
                case GameStep.RETURN_LOBBY: { 
                    const btn = await waitForButton(state.message!, baseCollectorFilter, baseWaitTime * 1000)

                    if (!btn)
                    {
                        await state.message?.edit({ embeds: [step7_embed_impostorReveal], components: [step7_row_impostorReveal] })
                    }
                    else if (btn.customId === "goto_impostorreveal")
                    { 
                        await btn.update({embeds: [step7_embed_impostorReveal], components: [step7_row_impostorReveal]})
                    }
                    state.step = GameStep.REVEAL
                    break
                }

                // --- STEP 7: Impostor reveal ---
                case GameStep.REVEAL: { 
                    const revealCollectorFilter = (i: MessageComponentInteraction) =>
                        i.user.id === state.hostId || i.user.id === state.impostor.id

                    const btn = await waitForButton(state.message!, revealCollectorFilter, baseWaitTime * 1000)

                    if (!btn)
                    {
                        await state.message?.edit({ embeds: [step7_1_embed_impostorRevealed], components: [step7_1_row_impostorRevealed] })
                    }
                    else if (btn.customId === "revealimpostor")
                    { 
                        await btn.update({embeds: [step7_1_embed_impostorRevealed], components: [step7_1_row_impostorRevealed]})
                    }
                    state.step = GameStep.END
                    break
                }
            }
        }

        // Timeout management
        if (state.step === GameStep.TIMEOUT)
        { 
            await interaction.editReply({ embeds: [timeoutError], components: [] })
        }
    }
}