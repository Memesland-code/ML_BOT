"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importStar(require("discord.js"));
const wokcommands_1 = __importDefault(require("wokcommands"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
var colors = require('colors');
dotenv_1.default.config();
const client = new discord_js_1.default.Client({
    intents: [discord_js_1.GatewayIntentBits.AutoModerationConfiguration, discord_js_1.GatewayIntentBits.AutoModerationExecution, discord_js_1.GatewayIntentBits.DirectMessageReactions, discord_js_1.GatewayIntentBits.DirectMessageTyping, discord_js_1.GatewayIntentBits.DirectMessages, discord_js_1.GatewayIntentBits.GuildEmojisAndStickers, discord_js_1.GatewayIntentBits.GuildIntegrations, discord_js_1.GatewayIntentBits.GuildInvites, discord_js_1.GatewayIntentBits.GuildMembers, discord_js_1.GatewayIntentBits.GuildMessageReactions, discord_js_1.GatewayIntentBits.GuildMessageTyping, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.GuildModeration, discord_js_1.GatewayIntentBits.GuildPresences, discord_js_1.GatewayIntentBits.GuildScheduledEvents, discord_js_1.GatewayIntentBits.GuildVoiceStates, discord_js_1.GatewayIntentBits.GuildWebhooks, discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.MessageContent]
});
client.on('ready', () => {
    new wokcommands_1.default({
        client,
        commandsDir: path_1.default.join(__dirname, "commands"),
    });
    fs_1.default.readFile('package.json', 'utf-8', function (err, data) {
        if (err)
            throw err;
        const obj = JSON.parse(data);
        const clientVersion = obj.version;
        client.user?.setActivity(`v${clientVersion} - by Memes_land`, { type: discord_js_1.ActivityType.Custom });
    });
});
client.login(process.env.TOKEN);
console.log(colors.green(`Bot successfully connected to Discord`));
