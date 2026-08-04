import { ActivityType, Client } from 'discord.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { writeLog } from './logger'

//* Updates the client presence and status depending on maintenance mode
export async function setClientActivity(client: Client, isMaintenance: boolean = false): Promise<void>
{
    try
    {
        const packagePath = path.join(process.cwd(), 'package.json')
        const data = await fs.readFile(packagePath, 'utf-8')
        const packageJson = JSON.parse(data)
        const clientVersion = packageJson.version || '0.0.0-err'

        if (isMaintenance)
        {
            client.user?.setStatus('dnd')
            client.user?.setActivity(`⚠️ Under maintenance - v${clientVersion} - by Memes_land`, {
                type: ActivityType.Playing
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