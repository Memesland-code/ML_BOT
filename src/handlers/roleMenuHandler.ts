import { ButtonInteraction, GuildMember, StringSelectMenuInteraction } from "discord.js"

export async function handleRoleInteraction(interaction: ButtonInteraction | StringSelectMenuInteraction)
{ 
    if (!interaction.guild || !(interaction.member instanceof GuildMember)) return

    await interaction.deferReply({ flags: ["Ephemeral"] })

    const member = interaction.member

    //? Buttons case (role:btn:ROLE_ID)
    if (interaction.isButton())
    { 
        const [, action, roleId] = interaction.customId.split(':')

        if (action === 'placeholder') return interaction.editReply("⚙️ Ce menu est en cours de configuration, vous ne pouvez pas interagir avec.")

        if (action === "btn" && roleId)
        { 
            const role = interaction.guild.roles.cache.get(roleId)

            // Self adjust: if the role was removed from the server
            if (!role)
            { 
                //TODO SELF REMOVE
                return interaction.editReply("❌ Ce rôle n'existe plus sur le serveur. Suppression en cours")
            }

            // Toggle logic
            if (member.roles.cache.has(role.id))
            { 
                await member.roles.remove(role.id).catch(() => null)
                return interaction.editReply(`🔴 Le rôle **${role.name}** vous a été retiré.`)
            }
            else
            { 
                await member.roles.add(role.id).catch(() => null)
                return interaction.editReply(`🟢 Le rôle **${role.name}** vous a été attribué !`)
            }
        }
    }


    //? Menus case (role:select:single OR role:select:multi)
    if (interaction.isStringSelectMenu())
    { 
        const selectedRoleIds = interaction.values

        // Getting all roles set in the menu (excluding placeholder)
        const allOptionRoleIds = interaction.component.options
            .filter((opt) => opt.value !== 'placeholder')
            .map((opt) => opt.value)

        const added: string[] = []
        const removed: string[] = []

        for (const roleId of allOptionRoleIds)
        { 
            const role = interaction.guild.roles.cache.get(roleId)
            if (!role) continue

            const hasRole = member.roles.cache.has(roleId)
            const isSelected = selectedRoleIds.includes(roleId)

            if (isSelected && !hasRole)
            {
                await member.roles.add(roleId).catch(() => null)
                added.push(`<@&${roleId}>`)
            }
            else if (!isSelected && hasRole)
            { 
                await member.roles.remove(roleId).catch(() => null)
                removed.push(`<@&${roleId}>`)
            }
        }

        let responseText = "Vos rôles ont été mis à jour :"
        if (added.length > 0) responseText += `\n🟢 **Ajouté(s):** ${added.join(', ')}`
        if (removed.length > 0) responseText += `\n🔴 **Retiré(s):** ${removed.join(', ')}`
        if (added.length === 0 && removed.length === 0) responseText = "Aucun changement effectué."

        return interaction.editReply(responseText)
    }
}