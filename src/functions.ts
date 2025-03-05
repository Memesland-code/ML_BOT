import { db, getCurrentLogFile } from "./index"
import colors from "colors"
import fs from "fs"

async function CheckTableExist(table) {
    await db.query("SHOW TABLES LIKE ?", [table], (err, results) => {
        if (err) throw err
        if (results.length > 0) {
            return true
        }
    })
    return false
}

export async function IsBotPerformingMaintenance(){
    if (await !CheckTableExist("Admin")) {
        console.log(colors.red("Error, table Admin does not exists!"))
        return false
    }
    
    return new Promise((resolve, reject) => {
        db.query("SELECT Value FROM Admin WHERE KeyName = 'MaintenanceState';", (error, results) => {
            if (error) {
                reject(error)
                return
            }

            resolve(results[0].Value != 0)
        })
    })
}

export function ExecuteQuery(query){
    return new Promise((resolve, reject) => {
        db.query(query, (error, results) => {
            if (error) {
                reject(error)
                return
            }

            resolve(results)
        })
    })
}

export function GetLogChannel(guildId) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT LogsChannel FROM ServersInfos WHERE GuildID = '${guildId}'`, (error, results) => {
            if (error) {
                reject(error)
                return
            }

            resolve(results[0].LogsChannel)
        })
    })
}

export async function HandleLog(logMessage) {

    console.log(logMessage)

    var logFile = await getCurrentLogFile()

    try {
        const fd = fs.openSync(`./logs/${logFile}.txt`, 'a')
        fs.appendFileSync(fd, colors.stripColors(logMessage))
        console.log("Log written to file succsessfuly!")
        fs.closeSync(fd)
    } catch (err) {
        console.log(colors.red(`Error when writting log to file : ${err}`))
    }
}