"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogChannel = exports.executeQuery = exports.IsBotPerformingMaintenance = void 0;
const index_1 = require("./index");
const colors_1 = __importDefault(require("colors"));
async function checkTableExist(table) {
    await index_1.db.query("SHOW TABLES LIKE ?", [table], (err, results) => {
        if (err)
            throw err;
        if (results.length > 0) {
            return true;
        }
    });
    return false;
}
async function IsBotPerformingMaintenance() {
    if (await !checkTableExist("Admin")) {
        console.log(colors_1.default.red("Error, table Admin does not exists!"));
        return false;
    }
    return new Promise((resolve, reject) => {
        index_1.db.query("SELECT Value FROM Admin WHERE KeyName = 'MaintenanceState';", (error, results) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(results[0].Value != 0);
        });
    });
}
exports.IsBotPerformingMaintenance = IsBotPerformingMaintenance;
function executeQuery(query) {
    return new Promise((resolve, reject) => {
        index_1.db.query(query, (error, results) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(results);
        });
    });
}
exports.executeQuery = executeQuery;
function getLogChannel(guildId) {
    return new Promise((resolve, reject) => {
        index_1.db.query(`SELECT LogsChannel FROM ServersInfos WHERE GuildID = '${guildId}'`, (error, results) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(results[0].LogsChannel);
        });
    });
}
exports.getLogChannel = getLogChannel;
