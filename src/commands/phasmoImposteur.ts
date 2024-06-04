import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from "discord.js"
import { CommandObject, CommandType } from "wokcommands"

//? Constants - Constants - Constants - Constants - Constants - Constants - Constants - Constants - Constants - Constants ?\\

//* Points reminder
const pointsReminder = new EmbedBuilder()
.setTitle("Rappel des points")
.setColor("DarkBlue")
.addFields(
  {name: "Relatif aux points, pour l'imposteur", value: "Tuer une personne = 1pt"},
  {name: "Relatif aux points, pour l'imposteur", value: "Aciver une chasse maudite = 1pt"},
  {name: "Relatif aux points, pour l'imposteur", value: "Tuer tout le monde = 1pt"},
  {name: "Relatif aux points, pour l'imposteur", value: "Trouver le fantôme ne fait pas gagner de points"},
  {name: "Relatif aux points, pour l'imposteur", value: "N'avoir aucun vote contre lui = 2pts"},

  {name: "‎", value: "‎"},

  {name: "Relatif aux points, pour les équipiers", value: "Trouver le type de fantôme = 1pt"},
  {name: "Relatif aux points, pour les équipiers", value: "Finir la partie en vie = 1pt"},
  {name: "Relatif aux points, pour les équipiers", value: "Finir la partie avec tous les équipiers envie = 1pt"},
  {name: "Relatif aux points, pour les équipiers", value: "Trouver le type de fantôme en étant mort ne fait pas gagner de points"},
  {name: "Relatif aux points, pour les équipiers", value: "Voter contre l'imposteur = 1pt"},

  {name: "‎", value: "‎"},

  {name: "Avant la partie", value: "Seul l'équipement de base est accepté (+ lampes puissantes et briquets)"},

  {name: "‎", value: "‎"},

  {name: "Pendant la partie", value: "Il est __interdit__ de camper dans le camion ou hors du lieu hanté"},
  {name: "Pendant la partie, relatif à l'imposteur", value: "Si l'imposteur meurt, il ne le dit pas et la partie continue normalement"},
  {name: "Pendant la partie", value: "Si la dernière personne en vie est l'imposteur, la partie prend fin directement _(il lui est alors interdit d'activer une chasse maudite)_"},

  {name: "‎", value: "‎"},

  {name: "Fin de partie (= après les 15 minutes)", value: "Toutes les personnes en vie __DOIVENT__ sortir du lieu hanté"},
  {name: "Fin de partie (= après les 15 minutes)", value: "La phase de vote commence alors. Celle-ci dure __maximum__ 10 minutes"},
  {name: "Fin de partie, phase de vote", value: "Les personnes __en vie__ discutent et soumettent leur vote contre celui qu'ils pensent être l'imposteur. Les personnes mortes n'ont pas le droit de parler aux vivants, ni de voter"},
  {name: "Fin de partie, phase de vote", value: "Si les 10 minutes sont écoulées et que les personnes sont toujours en partie, elles doivent impérativement donner leur choix de vote final et quitter la partie"},
  {name: "Fin de partie", value: "Si toutes les personnes sont mortes, la phase de vote est skip"},

  {name: "‎", value: "‎"},

  {name: "Après la partie", value: "L'imposteur est révélé par le bot et les points sont calculés"},
)
.setFooter({text: "Bonne chance à tous !"})



//* Step 1 - Players setup
const step1 = new EmbedBuilder()
.setTitle("Pré game - Choix des joueurs")
.setColor("Yellow")
.setFooter({text: "Tips: Attention au son des notifs !"})

const step1_button = new ButtonBuilder()
.setCustomId("choosemap")
.setLabel("Choix de la map")
.setStyle(ButtonStyle.Success)

const step1_row = new ActionRowBuilder<ButtonBuilder>()
.addComponents(step1_button)



//* Step 2 - Map setup
const step2 = new EmbedBuilder()
.setTitle("Pré game - Choix de la map")
.setColor("#FFF48D")
.setFields({name: "Map choisie", value: `‎`})
.setFooter({text: "Tips: Apprenez la position des cachettes, objets maudits et autres qui pourraient vous aider durant les parties !"})

const step2_button = new ButtonBuilder()
.setCustomId("chooseimpostor")
.setLabel("Choix de l'imposteur")
.setStyle(ButtonStyle.Success)

const step2_row = new ActionRowBuilder<ButtonBuilder>()
.addComponents(step2_button)



//* Step 3 - Impostor setup
const step3 = new EmbedBuilder()
.setTitle("Pré game - Choix de l'imposteur")
.setColor("Orange")
.setDescription("Un message a été envoyé à l'imposteur sélectionné\nVérifiez vos MP !")

//* Step 3.1 - Impostor message
const step3_1 = new EmbedBuilder()
.setTitle("Bonjour, imposteur !")
.setColor("Purple")
.setDescription("Vous avez été désigné imposteur pour cette partie.\nVeuillez cliquer sur le bouton pour informer que vous avez vu le message et passer à l'étape suivante.\nBonne chance à vous !")
.setFooter({text: "Tips: Ne vous faites pas remarquer !"})

const step3_1_button = new ButtonBuilder()
.setCustomId("impostorconfirm")
.setLabel("Valider")
.setStyle(ButtonStyle.Success)

const step3_1_button_confirmed = new ButtonBuilder()
.setCustomId("impostorconfirmed")
.setLabel("Validé")
.setStyle(ButtonStyle.Success)
.setDisabled(true)

const step3_1_row = new ActionRowBuilder<ButtonBuilder>()
.addComponents(step3_1_button)

const step3_1_confirmed_row = new ActionRowBuilder<ButtonBuilder>()
.addComponents(step3_1_button_confirmed)



//* Step 4 - Start waiting embed
const step4 = new EmbedBuilder()
.setTitle("Pré game - Attente du démarrage")
.setColor("#98FB98")
.setDescription("L'imposteur a été vérifié.\nPréparez-vous, la partie va bientôt commencer !\nRappel de la map : " + "none")

const step4_button = new ButtonBuilder()
.setCustomId("startgame")
.setLabel("Commencer")
.setStyle(ButtonStyle.Success)

const step4_row = new ActionRowBuilder<ButtonBuilder>()
.addComponents(step4_button)



//* Step 5 - In game embed
var gameTime = 15 // Remaining time before game ends in seconds
var isInGame = true // Check if players are in game to chose wether the bot should continue updating the remaining time or not
var step5 = new EmbedBuilder()
.setTitle("En game")
.setColor("DarkBlue")
.setFields({name: "Temps restant", value: `‎`})

const step5_button = new ButtonBuilder()
.setCustomId("endgame")
.setLabel("Finir la partie")
.setStyle(ButtonStyle.Secondary)

const step5_row = new ActionRowBuilder<ButtonBuilder>()
.addComponents(step5_button)



//* Step 6 - Voting embed
const step6 = new EmbedBuilder()
.setTitle("Post game - Phase de vote")
.setColor("#964b00")
.setDescription("Vous avez 10 minutes maximum pour discuter entre vivants et voter chacun pour une personne.\nA l'issu de votre vote, sélectionnez une entité si ce n'est pas déjà fait et quittez la partie.\n\nRestez en game pendant cette phase !")

const step6_1 = new EmbedBuilder()
.setTitle("Post game - Phase de vote")
.setColor("#964b00")
.setDescription("La phase de vote est terminée !\nVous devez immédiatement annoncer votre vote final et quitter la partie !")

const step6_button = new ButtonBuilder()
.setCustomId("endvotes")
.setLabel("Finir les votes")
.setStyle(ButtonStyle.Success)

const step6_row = new ActionRowBuilder<ButtonBuilder>()
.addComponents(step6_button)



//* Step 7 - Impostor reveal
const step7 = new EmbedBuilder()
.setTitle("Post game - Révélation de l'imposteur")
.setColor("#000000")
.setFields({name: "L'imposteur était", value: `???`})

const step7_1 = new EmbedBuilder()
.setTitle("Post game - Révélation de l'imposteur")
.setColor("#000000")

const step7_button = new ButtonBuilder()
.setCustomId("revealimpostor")
.setLabel("Révéler l'imposteur")
.setStyle(ButtonStyle.Danger)

const step7_1_button = new ButtonBuilder()
.setCustomId("impostorrevealed")
.setLabel("Imposteur révélé")
.setStyle(ButtonStyle.Danger)
.setDisabled(true)

const step7_row = new ActionRowBuilder<ButtonBuilder>()
.addComponents(step7_button)

const step7_1_row = new ActionRowBuilder<ButtonBuilder>()
.addComponents(step7_1_button)


//* Misc embeds
const timeoutError = new EmbedBuilder()
.setTitle("Partie annulée")
.setColor("Red")
.setDescription("La partie a été annulée car aucune action n'a été faite après 5 minutes")



const dmError = new EmbedBuilder()
.setTitle("Partie annulée")
.setColor("Red")


//? functions - functions - functions - functions - functions - functions - functions - functions - functions - functions ?\\


function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function func_step6(interaction: any, confirmation5: any, response5: any, isError: boolean, collectorFilter: any) {
  var response6
  if (isError) {
    response6 = await response5.edit({embeds: [step6], components: [step6_row]})
  } else {
    response6 = await confirmation5.update({embeds: [step6], components: [step6_row]})
  }

  try { //* Step 6 confirmation - vote
    const voteTimestamp = Date.now()
    step6.setFields({name: "Temps restant", value: `<t:${Math.floor(voteTimestamp / 1000) + 600}:R>`}) // 600
    response6.edit({embeds: [step6], components: [step6_row]})
    const confirmation6 = await response6.awaitMessageComponent({filter: collectorFilter, time: 600_000}) // 600_000

    if (confirmation6.customId === "endvotes") {
      func_step7(interaction, confirmation6, response6, false, collectorFilter)
    }

  } catch (error) {
    func_step7(interaction, undefined, response6, true, collectorFilter)
  }
}


async function func_step7(interaction: any, confirmation6: any, response6: any, isError: boolean, collectorFilter: any) {
  var response7
  if (isError) {
    response7 = await response6.edit({embeds: [step7], components: [step7_row]})
  } else {
    response7 = await confirmation6.update({embeds: [step7], components: [step7_row]})
  }

  try { //* Step 7 confirmation - reveal impostor
    const confirmation7 = await response7?.awaitMessageComponent({ filter: collectorFilter, time: 600_000})

    if (confirmation7.customId === "revealimpostor") {
      const response8 = await confirmation7.update({embeds: [step7_1], components: [step7_1_row]})
    }

  } catch (error) {
    await interaction?.editReply({embeds: [timeoutError], components: []})
  }
}


//? command - command - command - command - command - command - command - command - command - command ?\\


export default {
  description: "Lance une partie d'imposteurs Phasmophobia",
  type: CommandType.SLASH,
  guildOnly: true,
  permissions: [PermissionFlagsBits.Administrator],
  options: [
    {
      name: "player1",
      description: "Joueur 1",
      required: true,
      type: ApplicationCommandOptionType.User
    },
    {
      name: "player2",
      description: "Joueur 2",
      required: true,
      type: ApplicationCommandOptionType.User
    },
    {
      name: "player3",
      description: "Joueur 3",
      required: true,
      type: ApplicationCommandOptionType.User
    },
    {
      name: "player4",
      description: "Joueur 4",
      required: true,
      type: ApplicationCommandOptionType.User
    },
    {
      name: "include_medium_maps",
      description: "Si les maps moyennes doivent être incluses dans la liste",
      required: true,
      type: ApplicationCommandOptionType.Boolean
    },
    {
      name: "include_sunny_meadows",
      description: "Si Sunny Meadows doit être incluse dans la liste",
      required: true,
      type: ApplicationCommandOptionType.Boolean
    },
    {
      name: "include_rules_reminder",
      description: "Si un embed contenant un rappel des points doit être envoyé dans le channel",
      required: true,
      type: ApplicationCommandOptionType.Boolean
    }
  ],

  callback: async ({interaction, args}) => {

    var mapList = ["10 Ridgeview Court", "13 Willow Street", "42 Edgefield Road", "6 Tanglewood Drive", "Bleasdale Farmhouse", "Camp Woodwind", "Grafton Farmhouse"]

    if (args[4] == "true") mapList.push("Brownstone High School", "Maple Lodge Campsite", "Prison")
    if (args[5] == "true") mapList.push("Sunny Meadows Mental Institution")

    var chosenMap = mapList[Math.floor(Math.random() * mapList.length)]
    if (chosenMap == undefined) chosenMap = mapList[0]

    step2.setFields({name: "Map choisie", value: `${chosenMap}`})

    step1.setFields(
      {name: "Joueur 1", value: `<@${args[0]}>`},
      {name: "Joueur 2", value: `<@${args[1]}>`},
      {name: "Joueur 3", value: `<@${args[2]}>`},
      {name: "Joueur 4", value: `<@${args[3]}>`}
    )

    var impostor = interaction?.client.users.cache.get(args[Math.floor(Math.random() * 4)])

    if (args[6] == "true") await interaction?.channel?.send({embeds: [pointsReminder]})

    step4.setDescription("L'imposteur a été vérifié.\nPréparez-vous, la partie va bientôt commencer !\nRappel de la map : " + chosenMap)

    step7_1.setFields({name: "L'imposteur était", value: `${impostor}`})

    dmError.setDescription(`La partie a été annulée car l'imposteur choisi ${impostor} n'a pas autorisé l'envoi de MP sur ce serveur`)
    
    const response1 = await interaction?.reply({embeds: [step1], components: [step1_row]})

    const collectorFilter = (i: any) => i.user.id === interaction?.user.id

    //* Step 1 confirmation - players
    try {
      const confirmation = await response1?.awaitMessageComponent({ filter: collectorFilter, time: 300_000})

      if (confirmation?.customId === "choosemap") {
        const response2 = await confirmation.update({embeds: [step2], components: [step2_row]})

        //* Step 2 confirmation - map
        try {
          const confirmation2 = await response2.awaitMessageComponent({ filter: collectorFilter, time: 300_000})

          if (confirmation2.customId === "chooseimpostor") {
            const confirmation3 = await confirmation2.update({embeds: [step3], components: []})

            //* Step 3 confirmation - impostor
            try {
              const impostorResponse = await impostor?.send({embeds: [step3_1], components: [step3_1_row]})

              try {
                const impostorConfirmation = await impostorResponse?.awaitMessageComponent({time: 300_00})

                if (impostorConfirmation?.customId === "impostorconfirm") {
                  await impostorResponse?.edit({embeds: [step3_1], components: [step3_1_confirmed_row]})

                  const response4 = await confirmation3.edit({embeds: [step4], components: [step4_row]})

                  try { //* Step 4 confirmation - summary and start wait
                    const confirmation4 = await response4.awaitMessageComponent({ filter: collectorFilter, time: 300_000})

                    if (confirmation4.customId === "startgame") {
                      const response5 = await confirmation4.update({embeds: [step5], components: [step5_row]})

                      try { //* Step 5 confirmation - in game
                        const startTimestamp = Date.now()
                        step5.setFields({name: "Temps restant", value: `<t:${Math.floor(startTimestamp / 1000) + 900}:R>`}) // 900
                        confirmation4.editReply({embeds: [step5], components: [step5_row]})
                        const confirmation5 = await response5.awaitMessageComponent({filter: collectorFilter, time: 900_000}) // 900_000

                        if (confirmation5.customId === "endgame") {
                          func_step6(interaction, confirmation5, response5, false, collectorFilter)
                        }

                      } catch (e) {
                        func_step6(interaction, undefined, response5, true, collectorFilter)
                      }
                    }



                  } catch (e) {
                    await interaction?.editReply({embeds: [timeoutError], components: []})
                  }
                }



              } catch (error) {
                await interaction?.editReply({embeds: [timeoutError], components: []})
              }



            } catch (e) {
              await confirmation3.edit({embeds: [dmError], components: []})
            }
          }



        } catch (e) {
          await interaction?.editReply({embeds: [timeoutError], components: []})
        }
      }



    } catch (e) {
      await interaction?.editReply({embeds: [timeoutError], components: []})
    }
  }
} as CommandObject