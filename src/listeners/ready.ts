import { getMaintenanceStatus } from '#db/db.js'
import { setClientActivity } from '#discord/activity.js'
import { primeAuditLogCache } from '#discord/pendingVoiceLog.js'
import { writeLog } from '#logging/logger.js'
import { getClientVersion } from '#logging/package.js'
import { Listener } from '@sapphire/framework'
import { Client } from 'discord.js'

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

        // Applying maintenance status from DB
        const isMaintenance = await getMaintenanceStatus()
        await setClientActivity(client, isMaintenance)

        client.guilds.cache.forEach(guild => {
            primeAuditLogCache(guild)
        });
    }
}