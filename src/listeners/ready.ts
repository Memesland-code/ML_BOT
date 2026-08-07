import { Listener } from '@sapphire/framework'
import { Client } from 'discord.js'
import { setClientActivity } from '../utils/activity'
import { writeLog } from '../utils/logger'
import { getClientVersion } from '../utils/package'

export class ReadyListener extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            once: true,
            event: 'clientReady'
        })
    }

    public async run(client: Client): Promise<void>
    {
        const clientVersion = await getClientVersion()

        await writeLog(`Client successfully connected to Discord - running version ${clientVersion}\nConnection time: ${new Date().toLocaleString()}\n`, 'SUCCESS')

        await setClientActivity(client, true)
    }
}