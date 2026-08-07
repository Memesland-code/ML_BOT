import fs from 'node:fs/promises'
import path from 'node:path'

export async function getClientVersion(): Promise<string>
{
    try
    {
        const packagePath = path.join(process.cwd(), 'package.json')
        const data = await fs.readFile(packagePath, 'utf-8')
        const packageJson = JSON.parse(data)

        return packageJson.version || '0.0.0-err'
    }
    catch (error)
    {
        return '0.0.0-err'
    }
}