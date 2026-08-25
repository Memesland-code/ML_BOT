import { Precondition } from "@sapphire/framework"
import { ChatInputCommandInteraction, ContextMenuCommandInteraction, GuildMember, Message, PermissionFlagsBits, User } from "discord.js"

export class ModeratorsOnlyPrecondition extends Precondition
{
    public override async messageRun(message: Message)
    {
        return this.checkModerator(message.member)
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction)
    {
        return this.checkModerator(interaction.member as GuildMember)
    }

    public override async contextMenuRun(interaction: ContextMenuCommandInteraction)
    {
        return this.checkModerator(interaction.member as GuildMember)
    }

    private checkModerator(member: GuildMember | null)
    {
        if (member && member.permissions.has(PermissionFlagsBits.ModerateMembers)) return this.ok()

        return this.error({ message: '❌ Cette commande est réservée aux membresd de la modération' })
    }
}

declare module '@sapphire/framework' {
    interface Preconditions
    {
        ModeratorsOnly: never
    }
}