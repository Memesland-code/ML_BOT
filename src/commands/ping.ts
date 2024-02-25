import { PermissionFlagsBits } from "discord.js"
import { CommandObject, CommandType } from "wokcommands"

export default {
  description: "test command",
  type: CommandType.SLASH,
  permissions: [PermissionFlagsBits.Administrator],

  callback: ({interaction}) => {
    interaction?.reply({content: "test"})
  }
} as CommandObject