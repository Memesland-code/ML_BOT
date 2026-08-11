import { Listener } from "@sapphire/framework"
import { NonThreadGuildBasedChannel } from "discord.js"

export class ChannelCreateListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'channelCreate'
        })
    }

    public async run(channel: NonThreadGuildBasedChannel): Promise<void>
    {
        if (!channel.guild) return


    }
}