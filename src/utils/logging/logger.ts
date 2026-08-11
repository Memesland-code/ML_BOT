import { blue, cyan, gray, green, red, yellow } from 'colorette'
import console from 'node:console'
import fs from 'node:fs/promises'
import path from 'node:path'

const LOGS_DIR = path.join(process.cwd(), 'logs')
export type ConsoleLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS'


//* ANSI color codes checker to keep log files clean from unwanted characters
function stripAnsi(text: string): string
{
    return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
}


//* Return the current date formatted as YYYY-MM-DD
function getFormattedDate(): string
{
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}


//* Checks for logs directory existence
async function ensureLogsFolder()
{
    try
    {
        await fs.access(LOGS_DIR)
    }
    catch (error)
    {
        await fs.mkdir(LOGS_DIR, { recursive: true })
    }
}


//* Determines of constructs the active log file path for today
async function getActiveLogFilePath(): Promise<string>
{
    await ensureLogsFolder()

    const currentDate = getFormattedDate()
    const files = await fs.readdir(LOGS_DIR)

    let maxIndex = 0
    let hasMatch = false

    for (const file of files)
    {
        if (!file.endsWith('.txt')) continue

        const fileName = file.slice(0, -4)
        const parts = fileName.split('-')

        if (parts.length == 4)
        {
            const fileDate = `${parts[0]}-${parts[1]}-${parts[2]}`
            if (fileDate === currentDate)
            {
                hasMatch = true
                const index = parseInt(parts[3], 10)
                if (!isNaN(index) && index > maxIndex)
                {
                    maxIndex = index
                }
            }
        }
    }

    const currentIndex = hasMatch ? maxIndex : 1
    return path.join(LOGS_DIR, `${currentDate}-${currentIndex}.txt`)
}


//* Formats a basic single-line log with timestamp and color badge
function formatSimpleLog(message: string, level: ConsoleLogLevel): string
{
    const timestamp = new Date().toLocaleDateString()
    const timeTag = cyan(`[${timestamp}]`)

    let levelTag = ''
    switch (level)
    {
        case 'INFO':
            levelTag = blue('[INFO]')
            break
        case 'WARN':
            levelTag = yellow('[WARN]')
            break
        case 'ERROR':
            levelTag = red('[ERROR]')
            break
        case 'DEBUG':
            levelTag = gray('[DEBUG]')
            break
        case 'SUCCESS':
            levelTag = green('[SUCCESS]')
            break
    }

    return `${timeTag} ${levelTag} ${message}`
}


//* Main logger function: accepts basic messages with level OR custom pre-formatted text blocks
export async function writeLog(content: string, level?: ConsoleLogLevel): Promise<void>
{
    const formattedConsoleOutput = level ? formatSimpleLog(content, level) : content

    console.log(formattedConsoleOutput)

    const cleanFileOutput = stripAnsi(formattedConsoleOutput + '\n')

    try
    {
        const filePath = await getActiveLogFilePath()
        await fs.appendFile(filePath, cleanFileOutput, 'utf-8')
    }
    catch (error)
    {
        console.error(`[LOGGER FAILURE] Could not write log to file: ${error}`)
    }
}