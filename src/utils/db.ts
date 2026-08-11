import 'dotenv/config'
import mysql from 'mysql2/promise'
import { writeLog } from "./logger"


// Creating connection pool
export const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true
})


// Connects to the DB
export async function connectDatabase(): Promise<void>
{
    try
    {
        const connection = await db.getConnection()
        await connection.ping()
        connection.release()
        await writeLog('Successfully connected to database', 'SUCCESS')
    }
    catch (error: any)
    {
        // Check if the error is an AggregateError (array of underlying errors)
        if (error && Array.isArray(error.errors) && error.errors.length > 0)
        {
            for (const subError of error.errors)
            {
                await writeLog(
                    `MySQL Connection Error Detail: [${subError.code || 'UNKNOWN'}] ${subError.message}`,
                    'ERROR'
                )
            }
        }
        else
        {
            await writeLog(
                `Failed to connect to MySQL database: [${error.code || 'UNKNOWN'}] ${error.message || error}`,
                'ERROR'
            )
        }
    }
}


// Gets the current maintenance state
export async function getMaintenanceStatus(): Promise<boolean>
{
    try
    {
        const [rows] = await db.query<mysql.RowDataPacket[]>(
            `SELECT Value FROM Admin WHERE KeyName = ? LIMIT 1;`,
            ['MaintenanceState']
        )

        if (rows.length > 0)
        {
            return Number(rows[0].Value) === 1
        }

        return false
    }
    catch (error)
    {
        await writeLog(`Failed to fetch maintenance status from DB: ${error}`, "ERROR")
        return false
    }
}


// Sets the maintenance status
export async function setMaintenanceStatus(state: boolean): Promise<boolean>
{
    try
    {
        const numericValue = state ? 1 : 0

        await db.query(
            'UPDATE Admin SET Value = ? WHERE KeyName = ?',
            [numericValue, 'MaintenanceState']
        )

        return state
    }
    catch (error)
    {
        await writeLog(`Failed to update maintenance status in DB: ${error}`, 'ERROR')
        return state
    }
}