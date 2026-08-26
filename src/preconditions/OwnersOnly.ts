import { Precondition } from "@sapphire/framework"
import { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from "discord.js"

const owners = process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',').map(id => id.trim()) : []

export class OwnersOnlyPrecondition extends Precondition
{
    public override async messageRun(message: Message)
    {
        return this.checkOwner(message.author.id)
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction)
    {
        return this.checkOwner(interaction.user.id)
    }

    public override async contextMenuRun(interaction: ContextMenuCommandInteraction)
    {
        return this.checkOwner(interaction.user.id)
    }

    private checkOwner(userId: string)
    {
        return owners.includes(userId)
            ? this.ok()
            : this.error({ message: '❌ Cette commande est réservée aux propriétaires du bot' })
    }
}

declare module '@sapphire/framework' {
    interface Preconditions
    {
        OwnersOnly: never
    }
}