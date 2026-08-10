import { ApplicationCommandRegistry, Awaitable, Command } from "@sapphire/framework"
import { ChatInputCommandInteraction } from "discord.js"
import { writeLog } from "../../utils/logger"

export class PingCommand extends Command
{
    public constructor(context: Command.LoaderContext)
    {
        super(context, {
            name: 'ping',
            description: 'Vérifie la latence du bot et de l\'API Discord'
        })
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry): Awaitable<void>
    {
        registry.registerChatInputCommand((builder) =>
        {
            builder
                .setName(this.name)
                .setDescription(this.description)
        })
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction): Promise<void>
    {
        const response = await interaction.reply({ content: 'Ping...', withResponse: true })

        const fetchedMessage = response.resource?.message

        if (fetchedMessage)
        {
            const diff = fetchedMessage.createdTimestamp - interaction.createdTimestamp
            const ping = Math.round(this.container.client.ws.ping)

            await interaction.editReply(`Latence du bot : \`${diff}ms\`\nAPI Discord : \`${ping}ms\``)

            await writeLog(`Command /ping executed by ${interaction.user.tag} (${diff}ms / ${ping}ms)`, "INFO")
        }
        else
        {
            await interaction.editReply('Échec de la vérification du ping. Une erreur s\'est produite')
        }
    }
}
