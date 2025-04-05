const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dev')
    .setDescription('Herramientas de desarrollo')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), 

  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setColor("Random")
        .setTitle('MoonLigth | Dev Menu')
        .setDescription('Bienvenido a tu canal de voz temporal.\n\nUtiliza los siguientes menús desplegables para controlar la configuración/permisos de tu canal.\n\nComo alternativa, utiliza los comandos `/voice`.\n\nPara desactivar esta interfaz/ping, utiliza el siguiente comando `/toggle feature`.')
        .setThumbnail('URL_DE_LA_IMAGEN_DEL_BOT') 
        .setFooter({ text: 'MoonLigrh Channel Interface' });

      const settingsMenu = new SelectMenuBuilder()
        .setCustomId('settings-menu')
        .setPlaceholder('Change channel settings:')
        .addOptions([
          { label: 'Cambiar nombre', value: 'nombre' },
          { label: 'Cambiar límite de usuarios', value: 'limite' },
          { label: 'Cambiar bitrate', value: 'bitrate' },
        ]);

        const permissionsMenu = new SelectMenuBuilder()
        .setCustomId('permissions-menu')
        .setPlaceholder('Cambiar permisos del canal:')
        .addOptions([
          { label: 'Permitir a un usuario', value: 'permitir-usuario', description: 'Permite a un usuario específico unirse al canal.' },
          { label: 'Denegar a un usuario', value: 'denegar-usuario', description: 'Deniega el acceso a un usuario específico.' },
          { label: 'Permitir a un rol', value: 'permitir-rol', description: 'Permite a un rol específico unirse al canal.' },
          { label: 'Denegar a un rol', value: 'denegar-rol', description: 'Deniega el acceso a un rol específico.' },
          { label: 'Mostrar permisos', value: 'mostrar-permisos', description: 'Muestra los permisos actuales del canal.' },
          // ... más opciones de permisos
        ]);

      const inviteButton = new ButtonBuilder()
        .setLabel('Invita a MoonLigth a tu servidor')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.com/oauth2/authorize?client_id=1259146338516471879&scope=bot&permissions=1099511627775'); 

      const row = new ActionRowBuilder()
        .addComponents(settingsMenu, permissionsMenu);

      const buttonRow = new ActionRowBuilder()
        .addComponents(inviteButton);

      await interaction.reply({ embeds: [embed], components: [row, buttonRow] });

      const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: 60000 });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
      
          if (i.customId === 'settings-menu') {
            const opcion = i.values[0];
            if (opcion === 'nombre') {
              const modal = new ModalBuilder()
                .setCustomId('modal-nombre')
                .setTitle('Cambiar nombre del canal');
              const nombreInput = new TextInputBuilder()
                .setCustomId('nombre-input')
                .setLabel('Nuevo nombre')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
              const primeraAccion = new ActionRowBuilder().addComponents(nombreInput);
              modal.addComponents(primeraAccion);
              await interaction.showModal(modal);
      
              const submitted = await interaction.awaitModalSubmit({
                time: 60000,
                filter: i => i.user.id === interaction.user.id,
              }).catch(error => {
                console.error(error);
                return null;
              });
      
              if (submitted) {
                const nuevoNombre = submitted.fields.getTextInputValue('nombre-input');
                await interaction.channel.setName(nuevoNombre);
                await submitted.reply({ content: `El nombre del canal se ha cambiado a **${nuevoNombre}**.`, ephemeral: true });
              }
            } else if (opcion === 'limite') {
              const modal = new ModalBuilder()
                .setCustomId('modal-limite')
                .setTitle('Cambiar límite de usuarios');
              const limiteInput = new TextInputBuilder()
                .setCustomId('limite-input')
                .setLabel('Nuevo límite')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
              const primeraAccion = new ActionRowBuilder().addComponents(limiteInput);
              modal.addComponents(primeraAccion);
              await interaction.showModal(modal);
      
              const submitted = await interaction.awaitModalSubmit({
                time: 60000,
                filter: i => i.user.id === interaction.user.id,
              }).catch(error => {
                console.error(error);
                return null;
              });
      
              if (submitted) {
                const nuevoLimite = parseInt(submitted.fields.getTextInputValue('limite-input'));
                await interaction.channel.setUserLimit(nuevoLimite);
                await submitted.reply({ content: `El límite de usuarios del canal se ha cambiado a **${nuevoLimite}**.`, ephemeral: true });
              }
            } else if (opcion === 'bitrate') {
              const modal = new ModalBuilder()
                .setCustomId('modal-bitrate')
                .setTitle('Cambiar bitrate del canal');
              const bitrateInput = new TextInputBuilder()
                .setCustomId('bitrate-input')
                .setLabel('Nuevo bitrate (en kbps)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
              const primeraAccion = new ActionRowBuilder().addComponents(bitrateInput);
              modal.addComponents(primeraAccion);
              await interaction.showModal(modal);
      
              const submitted = await interaction.awaitModalSubmit({
                time: 60000,
                filter: i => i.user.id === interaction.user.id,
              }).catch(error => {
                console.error(error);
                return null;
              });
      
              if (submitted) {
                const nuevoBitrate = parseInt(submitted.fields.getTextInputValue('bitrate-input')) * 1000; 
                await interaction.channel.setBitrate(nuevoBitrate);
                await submitted.reply({ content: `El bitrate del canal se ha cambiado a **${nuevoBitrate / 1000} kbps**.`, ephemeral: true });
              }
            }
        } else if (i.customId === 'permissions-menu') {
            const opcion = i.values[0];
            if (opcion === 'permitir-usuario') {
              const modal = new ModalBuilder()
                .setCustomId('modal-permitir-usuario')
                .setTitle('Permitir usuario');
              const usuarioInput = new TextInputBuilder()
                .setCustomId('usuario-input')
                .setLabel('ID del usuario')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
              const primeraAccion = new ActionRowBuilder().addComponents(usuarioInput);
              modal.addComponents(primeraAccion);
              await interaction.showModal(modal);
          
              const submitted = await interaction.awaitModalSubmit({
                time: 60000,
                filter: i => i.user.id === interaction.user.id,
              }).catch(error => {
                console.error(error);
                return null;
              });
          
              if (submitted)   
           {
                const usuarioId = submitted.fields.getTextInputValue('usuario-input');
                try {
                  await interaction.channel.permissionOverwrites.edit(usuarioId, { ViewChannel: true });
                  await submitted.reply({ content: `Se ha permitido el acceso al usuario con ID **${usuarioId}**.`, ephemeral: true });
                } catch (error) {
                  console.error('Error al permitir el acceso al usuario:', error);
                  await submitted.reply({ content: 'No se pudo permitir el acceso al usuario.', ephemeral: true });
                }
              }
            } else if (opcion === 'denegar-usuario') {
                const modal = new ModalBuilder()
                  .setCustomId('modal-denegar-usuario')
                  .setTitle('Denegar usuario');
                const usuarioInput = new TextInputBuilder()
                  .setCustomId('usuario-input')
                  .setLabel('ID del usuario')
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true);
                const primeraAccion = new ActionRowBuilder().addComponents(usuarioInput);
                modal.addComponents(primeraAccion);
                await interaction.showModal(modal);
              
                const submitted = await interaction.awaitModalSubmit({
                  time: 60000,
                  filter: i => i.user.id === interaction.user.id,
                }).catch(error => {
                  console.error(error);
                  return null;
                });
              
                if (submitted) {
                  const usuarioId = submitted.fields.getTextInputValue('usuario-input');
                  try {
                    await interaction.channel.permissionOverwrites.edit(usuarioId, { ViewChannel: false });
                    await submitted.reply({ content: `Se ha denegado el acceso al usuario con ID **${usuarioId}**.`, ephemeral: true });
                  } catch (error) {
                    console.error('Error al denegar el acceso al usuario:', error);
                    await submitted.reply({ content: 'No se pudo denegar el acceso al usuario.', ephemeral: true });
                  }
                }
          
              if (submitted)   
           {
                const usuarioId = submitted.fields.getTextInputValue('usuario-input');
                try {
                  await interaction.channel.permissionOverwrites.edit(usuarioId, { ViewChannel: false });
                  await submitted.reply({ content: `Se ha denegado el acceso al usuario con ID **${usuarioId}**.`, ephemeral: true });
                } catch (error) {
                  console.error('Error al denegar el acceso al usuario:', error);
                  await submitted.reply({ content: 'No se pudo denegar el acceso al usuario.', ephemeral: true });
                }
              }
            }
          }

          await i.update({ content: 'Menú actualizado.', components: [row, buttonRow] }); 
        } else {
          await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
        }
      });

      collector.on('end', collected => console.log(`Se recogieron ${collected.size} interacciones.`));

    } catch (error) {
        console.error(`\n❌ Error al ejecutar el comando: \n${error}\n`);
  
        const errorEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Error')
          .setDescription('Hubo un error al ejecutar el comando. Por favor, inténtalo de nuevo más tarde.')
          .addFields(
            { name: 'Comando', value: `/${interaction.commandName}`, inline: true },
            { name: 'Usuario', value: interaction.user.tag, inline: true },
            { name: 'Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          )
          .setFooter({ text: 'Si el error persiste, contacta al desarrollador.' });
  
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    },
  };