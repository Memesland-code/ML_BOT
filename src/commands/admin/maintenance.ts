import { ApplicationCommandRegistry, Command } from "@sapphire/framework"
import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js"
import { setClientActivity } from "../../utils/activity"
import { getMaintenanceStatus, setMaintenanceStatus } from "../../utils/db"
import { writeLog } from "../../utils/logger"

export class MaintenanceCommand extends Command
{
    public constructor(context: Command.LoaderContext)
    {
        super(context, {
            name: 'maintenance',
            description: 'Sélectionne le mode de maintenance du bot'
        })
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry): void
    {
        registry.registerChatInputCommand((builder) =>
        {
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addBooleanOption((option) =>
                    option
                        .setName('state')
                        .setDescription('Activer ou désactiver le mode maintenance')
                        .setRequired(false)
                )
        })
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction): Promise<void>
    {
        const inputState = interaction.options.getBoolean('state')
        const currentState = await getMaintenanceStatus()

        // if no maintenance state given, reverse the current state
        const newState = inputState !== null ? inputState : !currentState

        await setMaintenanceStatus(newState)
        await setClientActivity(interaction.client, newState)

        const statusMessage = newState
            ? `🛠️ **Mode maintenance activé.** Le statut du bot a été mis à jour.`
            : '✅ **Mode maintenance désactivé.** Le bot est opérationnel'

        await interaction.reply({
            content: statusMessage,
            flags: 'Ephemeral'
        })

        await writeLog(
            `Maintenance mode set to [${newState}] by ${interaction.user.tag} (${interaction.user.id})`,
            "INFO"
        )
    }
}