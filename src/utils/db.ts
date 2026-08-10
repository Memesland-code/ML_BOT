import { writeLog } from "./logger"

// Temporary state before initializing Database
let maintenanceState = false

// Connects to the DB
export async function connectDatabase(): Promise<void>
{
    try
    {
        await writeLog('Successfully connected to database', 'SUCCESS')
    } catch (error)
    {
        await writeLog(`Failed to connect to Database: ${error}`, 'ERROR')
    }
}


// Gets the current maintenance state
export async function getMaintenanceStatus(): Promise<boolean>
{
    return maintenanceState
}


// Sets the maintenance status
export async function setMaintenanceStatus(state: boolean): Promise<boolean>
{
    maintenanceState = state
    return maintenanceState
}