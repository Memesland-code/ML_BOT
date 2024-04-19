import { ApplicationCommandOptionType, Embed, EmbedBuilder, PermissionFlagsBits } from "discord.js"
import { CommandObject, CommandType } from "wokcommands"

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
      name: "includemediummaps",
      description: "Si les maps moyennes doivent être incluses dans la liste",
      required: false,
      type: ApplicationCommandOptionType.Boolean
    },
    {
      name: "includesunnymeadows",
      description: "Si Sunny Meadows doit être incluse dans la liste",
      required: false,
      type: ApplicationCommandOptionType.Boolean
    },
    {
      name: "includerulesreminder",
      description: "Si un embed contenant un rappel des points doit être envoyé dans le channel",
      required: false,
      type: ApplicationCommandOptionType.Boolean
    }
  ],

  callback: ({interaction, args}) => {

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

      {name: "‎", value: "‎"},

      {name: "Après la partie", value: "L'imposteur est révélé par le bot et les points sont calculés"},
    )
    .setFooter({text: "Bonne chance à tous !"})



    //* Step 1 - Players setup
    const step1 = new EmbedBuilder()
    .setTitle("Pré game - Choix des joueurs")
    .setColor("Yellow")
    .setFields(
      {name: "Joueur 1", value: `${args[0]}`},
      {name: "Joueur 2", value: `${args[1]}`},
      {name: "Joueur 3", value: `${args[2]}`},
      {name: "Joueur 4", value: `${args[3]}`}
    )
    .setFooter({text: "Tips: Attention au son des notifs !"})



    //* Step 2 - Map setup
    var mapList = ["10 Ridgeview Court", "13 Willow Street", "42 Edgefield Road", "6 Tanglewood Drive", "Bleasdale Farmhouse", "Camp Woodwind", "Grafton Farmhouse"]
    if (args[4]) mapList.push("Brownstone High School", "Maple Lodge Campsite", "Prison")
    if (args[5]) mapList.push("Sunny Meadows Mental Institution")
    var chosenMap = mapList[Math.floor(Math.random() * mapList.length -1)]
    
    const step2 = new EmbedBuilder()
    .setTitle("Pré game - Choix de la map")
    .setColor("#FFF48D")
    .setFields({name: "Map choisie", value: `${chosenMap}`})
    .setFooter({text: "Tips: Apprenez la position des cachettes, objets maudits et autres qui pourraient vous aider durant les parties !"})



    //* Step 3 - Impostor setup
    var impostor = args[Math.floor(Math.random() * 4)]
    const step3 = new EmbedBuilder()
    .setTitle("Pré game - Choix de l'imposteur")
    .setColor("Orange")
    .setDescription("Un message a été envoyé à l'imposteur sélectionné\nVérifiez vos MP !")

    //* Step 3_1 - Impostor message
    const step3_1 = new EmbedBuilder()
    .setTitle("Bonjour, imposteur !")
    .setColor("Purple")
    .setDescription("Vous avez été désigné imposteur pour cette partie.\nVeuillez cliquer sur le bouton pour informer que vous avez vu le message et passer à l'étape suivante.\nBonne chance à vous !")
    .setFooter({text: "Tips: Ne vous faites pas remarquer !"})



    //* Step 4 - Start waiting embed
    const step4 = new EmbedBuilder()
    .setTitle("Pré game - Attente du démarrage")
    .setColor("#98FB98")
    .setDescription("Préparez-vous, la partie va bientôt commencer !\nRappel de la map : " + chosenMap)



    //* Step 5 - In game embed
    var gameTime = 15 // Remaining time before game ends
    var isInGame = false // Check if players are in game to chose wether the bot should continue updating the remaining time or not
    const step5 = new EmbedBuilder()
    .setTitle("En game")
    .setColor("DarkBlue")
    .setFields({name: "Temps restant", value: `${gameTime} minute(s)`})



    //* Step 6 - Voting embed
    const step6 = new EmbedBuilder()
    .setTitle("Post game - Phase de vote")
    .setColor("#964b00")
    .setDescription("Vous avez 10 minutes maximum pour discuter entre vivants et voter chacun pour une personne.\nA l'issu de votre vote, sélectionnez une entité si ce n'est pas déjà fait et quittez la partie.\n\nRestez en game pendant cette phase !")



    //* Step 7 - Impostor reveal
    const step7 = new EmbedBuilder()
    .setTitle("Post game - Révélation de l'imposteur")
    .setColor("#000000")
    .setFields({name: "L'imposteur était", value: `???`})

    const step7_1 = new EmbedBuilder()
    .setTitle("Post game - Révélation de l'imposteur")
    .setColor("#000000")
    .setFields({name: "L'imposteur était", value: `${impostor}`})



    const timeoutError = new EmbedBuilder()
    .setTitle("Partie annulée")
    .setColor("Red")
    .setDescription("La partie a été annulée car aucune action n'a été faite après 5 minutes")



    const dmError = new EmbedBuilder()
    .setTitle("Partie annulée")
    .setColor("Red")
    .setDescription(`La partie a été annulée car l'imposteur choisi ${impostor} n'a pas autorisé l'envoe de MP sur ce serveur`)
  }
} as CommandObject