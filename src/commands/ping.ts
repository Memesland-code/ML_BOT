import { CommandObject, CommandType } from "wokcommands"

export default {
  description: "test command",
  type: CommandType.SLASH,

  callback: ({interaction}) => {
    interaction?.reply({content: "test"})
  }
} as CommandObject