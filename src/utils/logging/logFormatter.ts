import { blue, cyan, magenta, red, white, yellow } from 'colorette'

export type LogSeverity = 'low' | 'medium' | 'high'

interface EventLogData
{
    eventName: string
    guildName: string
    guildId: string
    severity?: LogSeverity
    executor?: { name: string | null, id: string }
    details: Record<string, string | undefined>
}


// Color mapper for header and labels
const severityColors = {
    low: blue,
    medium: yellow,
    high: red
}


// Formats a standardized multi-line console log string for Discord events
export function formatEventLog(data: EventLogData): string
{
    const colorFn = severityColors[data.severity ?? 'medium']

    let output = colorFn(`EVENT\n${data.eventName}\n`)
    output += colorFn(`in Server: `) + white(`${data.guildName}\n`)
    output += colorFn(`Server ID: `) + white(`${data.guildId}\n`)

    for (const [key, value] of Object.entries(data.details))
    {
        if (value)
        {
            output += colorFn(`${key}: `) + white(`${value}\n`)
        }
    }

    if (data.executor)
    {
        const executorName = data.executor.name ?? 'Unknown'
        output += magenta('Executor: ') + white(`${executorName}\n`)
        output += magenta('ID: ') + white(`${data.executor.id}\n`)
    }
    else
    {
        output += magenta('Executor: ') + white(`Unknown\n`)
        output += magenta('ID: ') + white(`Unknown\n`)
    }

    output += cyan(`${new Date().toLocaleString()}\n`)
    return output
}