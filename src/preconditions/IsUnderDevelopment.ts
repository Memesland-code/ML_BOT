import { Precondition } from "@sapphire/framework"
import { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from "discord.js"

const owners = process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',').map(id => id.trim()) : []

export class IsUnderDevelopmentPrecondition extends Precondition
{ 
    public override async messageRun(message: Message)
    { 
        return this.IsDevelopment(message.author.id)
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction)
    { 
        return this.IsDevelopment(interaction.user.id)
    }

    public override async contextMenuRun(interaction: ContextMenuCommandInteraction)
    { 
        return this.IsDevelopment(interaction.user.id)
    }

    private IsDevelopment(userId: string)
    { 
        return owners.includes(userId)
            ? this.ok()
            : this.error({message: '🛠️ Cette commande est en cours de développement, et est donc inutilisable pour le moment...'})
    }
}

declare module '@sapphire/framework' { 
    interface Preconditions
    { 
        IsUnderDevelopment: never
    }
}