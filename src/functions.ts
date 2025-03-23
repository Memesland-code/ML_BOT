import colors from "colors"
import fs from "fs"
import { RowDataPacket } from "mysql2"
import { db, getCurrentLogFile } from "./index"

interface AdminRow extends RowDataPacket {
    Value: number
}

interface ServersInfosRow extends RowDataPacket {
    LogsChannel: string;
    HighLogsChannel: string;
}

export async function CheckTableExist(table: String) {
    const [rows] = await db.query(`SHOW TABLES LIKE "${table}"`)
    return ((rows as any[]).length > 0)
}

export async function IsBotPerformingMaintenance() {
    if (await !CheckTableExist("Admin")) {
        HandleLog(colors.red("Error, table Admin does not exists!"))
        return false
    }

    const [rows] = await db.query<AdminRow[]>(`SELECT Value FROM Admin WHERE KeyName = 'MaintenanceState';`)
    return rows[0].Value != 0
}

export async function ExecuteQuery(query: string): Promise<any> {
    const [rows] = await db.query(query)
    return rows
}

export async function GetLogChannel(guildId: String) {
    const [rows] = await db.query<ServersInfosRow[]>(`SELECT LogsChannel FROM ServersInfos WHERE GuildID = '${guildId}'`)
    return rows[0].LogsChannel
}

export async function GetHighLogChannel(guildId: String) {
    const [rows] = await db.query<ServersInfosRow[]>(`SELECT HighLogsChannel FROM ServersInfos WHERE GuildID = '${guildId}'`)
    return rows[0].HighLogsChannel
}

export async function HandleLog(logMessage: String | unknown) {

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