import colors from "colors"
import fs from "fs"
import { db, getCurrentLogFile } from "./index"

export async function CheckTableExist(table) {
    const [rows] = await db.query(`SHOW TABLES LIKE "${table}"`)
    return ((rows as any[]).length > 0)
}

export async function IsBotPerformingMaintenance() {
    if (await !CheckTableExist("Admin")) {
        HandleLog(colors.red("Error, table Admin does not exists!"))
        return false
    }

    const [rows] = await db.query(`SELECT Value FROM Admin WHERE KeyName = 'MaintenanceState';`)
    return (rows[0].Value != 0)
}

export async function ExecuteQuery(query: string): Promise<[any[], any]> {
    const [rows] = await db.query(query)
    return (rows)
}

export async function GetLogChannel(guildId) {
    const [rows] = await db.query(`SELECT LogsChannel FROM ServersInfos WHERE GuildID = '${guildId}'`)
    return (rows[0].LogsChannel)
}

export async function GetHighLogChannel(guildId) {
    const [rows] = await db.query(`SELECT HighLogsChannel FROM ServersInfos WHERE GuildID = '${guildId}'`)
    return (rows[0].HighLogsChannel)
}

export async function HandleLog(logMessage) {

    console.log(logMessage)

    var logFile = await getCurrentLogFile()

    try {
        const fd = fs.openSync(`./logs/${logFile}.txt`, 'a')
        fs.appendFileSync(fd, colors.stripColors(logMessage + "\n"))
        fs.closeSync(fd)
    } catch (err) {
        HandleLog(colors.red(`Error when writting log to file : ${err}`))
    }
}