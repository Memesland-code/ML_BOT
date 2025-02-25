import { db } from "./index"
import colors from "colors"

async function checkTableExist(table) {
    await db.query("SHOW TABLES LIKE ?", [table], (err, results) => {
        if (err) throw err
        if (results.length > 0) {
            return true
        }
    })
    return false
}

export async function IsBotPerformingMaintenance(){
    if (await !checkTableExist("Admin")) {
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

export function executeQuery(query){
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

export function getLogChannel(guildId) {
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