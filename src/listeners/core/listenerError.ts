import { writeLog } from '#logging/logger.js'
import { Listener, ListenerErrorPayload } from '@sapphire/framework'

export class CoreListenerError extends Listener
{
    public constructor(context: Listener.LoaderContext)
    {
        super(context, {
            event: 'listenerError'
        })
    }

    public async run(error: unknown, payload: ListenerErrorPayload): Promise<void>
    {
        const listenerName = payload.piece.name
        await writeLog(`Error in listener [${listenerName}]: ${error}`, 'ERROR')
    }
}