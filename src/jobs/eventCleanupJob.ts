import { ExecuteQuery } from "#db/db.js"
import { writeLog } from "#logging/logger.js"

/**
 ** Purges events older than 24 hours from the DB
 */
export async function runEventCleanup(): Promise<void>
{ 
    try
    {
        const result: any = await ExecuteQuery(
            `DELETE FROM events WHERE event_date < NOW() - INTERVAL 1 DAY`
        )

        if (result.affectedRows > 0)
        {
            writeLog(`[EventCleanupJob] Purged ${result.affectedRows} expired event(s).`, 'INFO')
        }
    }
    catch (error)
    {
        writeLog(`[EventCleanupJob] Failed to purge expired events: ${error}`, 'ERROR')
    }
}



/**
 ** Calculates milliseconds remaining unntil the next 06:00 AM target time
 */
function getMsUntilNextSixAM(): number
{ 
    const now = new Date()
    const nextSixAM = new Date(now)

    nextSixAM.setHours(6, 0, 0, 0)

    // If it's already past 6:00 AM today, set target to 6:00 AM tomorrow
    if (now >= nextSixAM) nextSixAM.setDate(nextSixAM.getDate() + 1)

    return nextSixAM.getTime() - now.getTime()
}



/**
 ** Starts the background interval check loop (checks every 6 hours)
 */
export function initEventCleanupJob(): void
{ 
    void runEventCleanup()

    const msUntilFirstRun = getMsUntilNextSixAM()

    setTimeout(() => {
        void runEventCleanup() 

        setInterval(() => {
            void runEventCleanup()
        }, 24 * 60 * 60 * 1000);

    }, msUntilFirstRun);

    const nextRunDate = new Date(Date.now() + msUntilFirstRun).toLocaleString()
    writeLog(`[EventCleanupJob] Maintenance job scheduled (Next fixed run at 06:00 AM on ${nextRunDate}).`, 'INFO')
}