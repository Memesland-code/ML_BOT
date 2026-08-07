import { ActivityType, Client } from 'discord.js'
import { writeLog } from './logger'
import { getClientVersion } from './package'

//* Updates the client presence and status depending on maintenance mode
export async function setClientActivity(client: Client, isMaintenance: boolean = false): Promise<void>
{
    try
    {
        const clientVersion = await getClientVersion()

        if (isMaintenance)
        {
            client.user?.setStatus('dnd')
            client.user?.setActivity(`⚠️ Under maintenance - v${clientVersion} - by Memes_land`, {
                type: ActivityType.Custom,
            })
        }
        else
        {
            client.user?.setStatus('online')
            client.user?.setActivity(`v${clientVersion} - by Memes_land`, {
                type: ActivityType.Playing
            })
        }

        await writeLog(`Client presence updated (Maintenance: ${isMaintenance})`, 'INFO')
    }
    catch (error)
    {
        await writeLog(`Error while reading package.json or updating activity: ${error}`, 'ERROR')
    }
} 