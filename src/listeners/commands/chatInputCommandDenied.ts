import { ChatInputCommandDeniedPayload, Listener, UserError } from "@sapphire/framework"

export class ChatInputCommmandDeniedListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(
            context, {
            event: 'chatInputCommandDenied'
        })
    }

    public async run(error: UserError, { interaction }: ChatInputCommandDeniedPayload)
    {
        if (interaction.replied || interaction.deferred)
        {
            await interaction.followUp({ content: error.message, flags: ['Ephemeral'] })
        }
        else 
        {
            await interaction.reply({ content: error.message, flags: ['Ephemeral'] })
        }
    }
}