import { getMaintenanceStatus } from "#db/db.js"
import { AllFlowsPrecondition } from "@sapphire/framework"
import { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from "discord.js"

const owners = process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',').map(id => id.trim()) : []

export class GlobalMaintenancePrecondition extends AllFlowsPrecondition
{
    public constructor(context: AllFlowsPrecondition.LoaderContext, options: AllFlowsPrecondition.Options)
    { 
        super(context, {
            ...options,
            position: 20
        })
    }

    public override async messageRun(message: Message) 
    {
        return this.checkMaintenance(message.author.id)
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) 
    {
        return this.checkMaintenance(interaction.user.id)
    }

    public override async contextMenuRun(interaction: ContextMenuCommandInteraction) 
    {
        return this.checkMaintenance(interaction.user.id)
    }

    private async checkMaintenance(userId: string)
    { 
        const isMaintenance = await getMaintenanceStatus()

        if (isMaintenance)
        { 
            const isBotAdmin = owners.includes(userId)
            if (isBotAdmin) return this.ok()

            return this.error({message: '🛠️ Le bot est actuellement en cours de maintenance. Les commandes sont temporairement indisponibles, merci de patienter.'})
        }

        return this.ok()
    }
}