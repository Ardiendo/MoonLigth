
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const simpleGit = require('simple-git');
const { exec } = require('child_process');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('repo')
    .setDescription('Comandos para gestionar el repositorio de GitHub.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('update')
        .setDescription('Actualiza el bot desde el repositorio de GitHub.'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Muestra el estado del repositorio.'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('commit')
        .setDescription('Realiza un commit de los cambios.')
        .addStringOption(option =>
          option
            .setName('mensaje')
            .setDescription('Mensaje del commit.')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('push')
        .setDescription('Sube los commits al repositorio remoto.'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Revierte los cambios al último commit.')
        .addStringOption(option =>
          option
            .setName('modo')
            .setDescription('Tipo de reset a realizar')
            .setRequired(false)
            .addChoices(
              { name: 'Soft (conserva cambios en el área de trabajo)', value: 'soft' },
              { name: 'Mixed (conserva cambios sin staged)', value: 'mixed' },
              { name: 'Hard (elimina todos los cambios)', value: 'hard' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('log')
        .setDescription('Muestra el historial de commits.')
        .addIntegerOption(option =>
          option
            .setName('cantidad')
            .setDescription('Número de commits a mostrar')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(15))),

  async execute(interaction) {
    const developerId = process.env.DEVELOPER_ID;

    if (interaction.user.id !== developerId) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Error de Permisos')
        .setDescription('Solo el desarrollador del bot puede ejecutar comandos de repositorio.')
        .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      const git = simpleGit();

      // Verificar si el directorio actual es un repositorio git
      try {
        await git.revparse(['--is-inside-work-tree']);
      } catch (error) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Error de Repositorio')
          .setDescription('El directorio actual no es un repositorio Git válido.')
          .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      switch (subcommand) {
        case 'update':
          await handleUpdate(interaction, git);
          break;
        case 'status':
          await handleStatus(interaction, git);
          break;
        case 'commit':
          await handleCommit(interaction, git);
          break;
        case 'push':
          await handlePush(interaction, git);
          break;
        case 'reset':
          await handleReset(interaction, git);
          break;
        case 'log':
          await handleLog(interaction, git);
          break;
      }
    } catch (error) {
      console.error('Error al ejecutar el comando:', error);

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Error Inesperado')
        .setDescription(`Hubo un error al ejecutar el comando: ${error.message}`)
        .addFields(
          { name: 'Detalles técnicos', value: `\`\`\`${error.stack ? error.stack.slice(0, 1000) : 'No disponible'}\`\`\`` }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

async function handleUpdate(interaction, git) {
  const confirmationEmbed = new EmbedBuilder()
    .setColor('Yellow')
    .setTitle('⚠️ Confirmar actualización')
    .setDescription('¿Estás seguro de que quieres actualizar el bot? Esto puede tardar unos minutos y reiniciará el bot.')
    .addFields(
      { name: '⚠️ Advertencia', value: 'Asegúrate de haber guardado todos los cambios locales importantes antes de continuar.' }
    );

  const confirmationButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('confirmar-update')
        .setLabel('Confirmar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('cancelar-update')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Danger),
    );

  const confirmationReply = await interaction.reply({ embeds: [confirmationEmbed], components: [confirmationButtons], fetchReply: true });

  const collector = confirmationReply.createMessageComponentCollector({ time: 60000 });

  collector.on('collect', async i => {
    if (i.user.id === interaction.user.id) {
      if (i.customId === 'confirmar-update') {
        await i.update({ content: '🔄 Actualizando el bot... esto puede tardar unos minutos.', embeds: [], components: [] });

        try {
          // Comprobar si hay cambios locales no confirmados
          const status = await git.status();
          if (!status.isClean()) {
            const statusEmbed = new EmbedBuilder()
              .setColor('Yellow')
              .setTitle('⚠️ Cambios locales detectados')
              .setDescription('Hay cambios sin confirmar en el repositorio. ¿Qué deseas hacer?')
              .addFields(
                { name: 'Archivos modificados', value: status.modified.length > 0 ? status.modified.join('\n').substring(0, 1024) : 'Ninguno' },
                { name: 'Archivos nuevos', value: status.not_added.length > 0 ? status.not_added.join('\n').substring(0, 1024) : 'Ninguno' }
              );

            const stashButtons = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('stash-changes')
                  .setLabel('Guardar cambios temporalmente')
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId('discard-changes')
                  .setLabel('Descartar cambios')
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId('cancel-update')
                  .setLabel('Cancelar actualización')
                  .setStyle(ButtonStyle.Secondary),
              );

            const stashReply = await interaction.editReply({ content: null, embeds: [statusEmbed], components: [stashButtons] });

            const stashCollector = stashReply.createMessageComponentCollector({ time: 60000 });

            stashCollector.on('collect', async j => {
              if (j.user.id === interaction.user.id) {
                if (j.customId === 'stash-changes') {
                  await j.update({ content: '📦 Guardando cambios temporalmente...', embeds: [], components: [] });
                  await git.stash();
                  await performUpdate(interaction, git);
                } else if (j.customId === 'discard-changes') {
                  await j.update({ content: '🗑️ Descartando cambios locales...', embeds: [], components: [] });
                  await git.reset(['--hard']);
                  await performUpdate(interaction, git);
                } else if (j.customId === 'cancel-update') {
                  await j.update({ content: '❌ Actualización cancelada.', embeds: [], components: [] });
                }
              } else {
                await j.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
              }
            });

            stashCollector.on('end', collected => {
              if (collected.size === 0) {
                interaction.editReply({ content: '⏱️ Se agotó el tiempo de espera. Actualización cancelada.', embeds: [], components: [] });
              }
            });
          } else {
            await performUpdate(interaction, git);
          }
        } catch (error) {
          console.error('Error al actualizar el bot:', error);
          const errorEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Error al actualizar')
            .setDescription(`Hubo un error al actualizar el bot: ${error.message}`)
            .setTimestamp();
          await interaction.editReply({ content: null, embeds: [errorEmbed], components: [] });
        }
      } else if (i.customId === 'cancelar-update') {
        await i.update({ content: '❌ Actualización cancelada.', embeds: [], components: [] });
      }
    } else {
      await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
    }
  });

  collector.on('end', collected => {
    if (collected.size === 0) {
      interaction.editReply({ content: '⏱️ Se agotó el tiempo de espera. Actualización cancelada.', embeds: [], components: [] });
    }
  });
}

async function performUpdate(interaction, git) {
  await interaction.editReply({ content: '🔄 Actualizando desde el repositorio remoto...' });

  try {
    // Obtenemos la rama actual
    const branch = await git.branch();
    const currentBranch = branch.current;

    // Actualizamos desde el remoto
    await git.pull('origin', currentBranch);
    
    // Instalamos dependencias si hay cambios en package.json
    await interaction.editReply({ content: '📦 Verificando e instalando dependencias...' });
    await new Promise((resolve, reject) => {
      exec('npm install', (error, stdout, stderr) => {
        if (error) {
          console.warn('Advertencia al instalar dependencias:', error);
          // No rechazamos la promesa para continuar con el proceso
        }
        resolve();
      });
    });

    // Reiniciamos el bot
    await interaction.editReply({ content: '🔄 Reiniciando el bot...' });
    await new Promise((resolve, reject) => {
      exec('pm2 restart moon.js', (error, stdout, stderr) => {
        if (error) {
          console.error('Error al reiniciar el bot:', error);
          reject(error);
          return;
        }
        resolve();
      });
    });

    // Mostramos información del último commit
    const lastCommit = await git.log({ maxCount: 1 });
    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Bot actualizado con éxito!')
      .setDescription(`El bot ha sido actualizado a la última versión disponible en GitHub.`)
      .addFields(
        { name: 'Commit', value: `\`${lastCommit.latest.hash.substring(0, 7)}\` - ${lastCommit.latest.message}`, inline: false },
        { name: 'Autor', value: lastCommit.latest.author_name, inline: true },
        { name: 'Fecha', value: `<t:${Math.round(lastCommit.latest.date.getTime() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  } catch (error) {
    console.error('Error en la actualización:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('❌ Error al actualizar')
      .setDescription(`Hubo un error al actualizar el bot: ${error.message}`)
      .setTimestamp();
    await interaction.editReply({ content: null, embeds: [errorEmbed] });
  }
}

async function handleStatus(interaction, git) {
  await interaction.deferReply();
  
  try {
    const status = await git.status();
    const branch = await git.branch();
    
    // Obtenemos información sobre commits ahead/behind
    let branchStatus = '';
    if (status.ahead > 0 || status.behind > 0) {
      branchStatus += status.ahead > 0 ? `**${status.ahead}** commit(s) adelante del remoto\n` : '';
      branchStatus += status.behind > 0 ? `**${status.behind}** commit(s) detrás del remoto\n` : '';
    } else if (status.tracking) {
      branchStatus = 'Sincronizado con el remoto';
    } else {
      branchStatus = 'No hay información de seguimiento';
    }

    const embed = new EmbedBuilder()
      .setColor(status.isClean() ? 'Green' : 'Yellow')
      .setTitle(`📊 Estado del Repositorio | ${branch.current}`)
      .setDescription(status.isClean() ? '✅ El repositorio está limpio, no hay cambios pendientes.' : '⚠️ Hay cambios pendientes en el repositorio.')
      .addFields(
        { name: 'Rama Actual', value: branch.current, inline: true },
        { name: 'Estado con Remoto', value: branchStatus || 'No disponible', inline: true },
        { name: 'Archivos Modificados', value: status.modified.length > 0 ? status.modified.join('\n').substring(0, 1024) : 'Ninguno', inline: false },
        { name: 'Archivos Nuevos', value: status.not_added.length > 0 ? status.not_added.join('\n').substring(0, 1024) : 'Ninguno', inline: false },
        { name: 'Archivos Eliminados', value: status.deleted.length > 0 ? status.deleted.join('\n').substring(0, 1024) : 'Ninguno', inline: false },
        { name: 'Archivos en Staging', value: status.staged.length > 0 ? status.staged.join('\n').substring(0, 1024) : 'Ninguno', inline: false }
      )
      .setTimestamp();

    // Si hay cambios, añadimos botones para commit rápido o reset
    let components = [];
    if (!status.isClean()) {
      const actionButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('quick-commit')
            .setLabel('Commit Rápido')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('quick-reset')
            .setLabel('Descartar Cambios')
            .setStyle(ButtonStyle.Danger)
        );
      components.push(actionButtons);
    }

    const response = await interaction.editReply({ embeds: [embed], components });

    // Solo añadimos el collector si hay componentes
    if (components.length > 0) {
      const collector = response.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          if (i.customId === 'quick-commit') {
            const modal = new ModalBuilder()
              .setCustomId('commit-modal')
              .setTitle('Realizar Commit');
            
            const commitMessageInput = new TextInputBuilder()
              .setCustomId('commit-message')
              .setLabel('Mensaje del commit')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Describe los cambios realizados')
              .setRequired(true);
            
            const row = new ActionRowBuilder().addComponents(commitMessageInput);
            modal.addComponents(row);
            
            await i.showModal(modal);
          } else if (i.customId === 'quick-reset') {
            await i.update({ content: '🔄 Descartando cambios...', components: [] });
            await git.reset(['--hard']);
            
            const resetEmbed = new EmbedBuilder()
              .setColor('Green')
              .setTitle('✅ Cambios Descartados')
              .setDescription('Todos los cambios locales han sido descartados.')
              .setTimestamp();
            
            await interaction.editReply({ content: null, embeds: [resetEmbed], components: [] });
          }
        } else {
          await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.editReply({ embeds: [embed], components: [] });
        }
      });
    }
  } catch (error) {
    console.error('Error al obtener el estado del repositorio:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('❌ Error')
      .setDescription(`Hubo un error al obtener el estado del repositorio: ${error.message}`)
      .setTimestamp();
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleCommit(interaction, git) {
  const mensaje = interaction.options.getString('mensaje');
  
  try {
    const status = await git.status();
    
    if (status.isClean()) {
      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('⚠️ Aviso')
        .setDescription('No hay cambios para confirmar.')
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      return;
    }
    
    await interaction.deferReply();
    
    // Mostramos los archivos que se van a incluir en el commit
    const statusEmbed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('📋 Archivos a incluir en el commit')
      .addFields(
        { name: 'Archivos Modificados', value: status.modified.length > 0 ? status.modified.join('\n').substring(0, 1024) : 'Ninguno', inline: false },
        { name: 'Archivos Nuevos', value: status.not_added.length > 0 ? status.not_added.join('\n').substring(0, 1024) : 'Ninguno', inline: false },
        { name: 'Archivos Eliminados', value: status.deleted.length > 0 ? status.deleted.join('\n').substring(0, 1024) : 'Ninguno', inline: false }
      )
      .setTimestamp();
    
    await interaction.editReply({ embeds: [statusEmbed], content: '🔄 Preparando commit...' });
    
    // Añadimos todos los archivos y hacemos el commit
    await git.add('.');
    await git.commit(mensaje);
    
    // Obtenemos información del commit realizado
    const log = await git.log({ maxCount: 1 });
    const lastCommit = log.latest;
    
    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Commit Realizado')
      .setDescription(`Se ha realizado el commit con éxito.`)
      .addFields(
        { name: 'Mensaje', value: mensaje, inline: false },
        { name: 'Hash', value: lastCommit.hash.substring(0, 7), inline: true },
        { name: 'Autor', value: lastCommit.author_name, inline: true },
        { name: 'Fecha', value: `<t:${Math.round(lastCommit.date.getTime() / 1000)}:R>`, inline: true }
      )
      .setTimestamp();
    
    const pushButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('push-now')
          .setLabel('Push al Remoto')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🚀')
      );
    
    const response = await interaction.editReply({ content: null, embeds: [embed], components: [pushButton] });
    
    const collector = response.createMessageComponentCollector({ time: 60000 });
    
    collector.on('collect', async i => {
      if (i.user.id === interaction.user.id) {
        if (i.customId === 'push-now') {
          await i.update({ content: '🔄 Subiendo cambios al repositorio remoto...', components: [] });
          
          try {
            await git.push();
            
            const pushEmbed = new EmbedBuilder()
              .setColor('Green')
              .setTitle('✅ Push Completado')
              .setDescription('Los cambios han sido subidos al repositorio remoto con éxito.')
              .setTimestamp();
            
            await interaction.editReply({ content: null, embeds: [pushEmbed], components: [] });
          } catch (error) {
            console.error('Error al hacer push:', error);
            const errorEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('❌ Error al subir cambios')
              .setDescription(`No se pudieron subir los cambios al remoto: ${error.message}`)
              .setTimestamp();
            await interaction.editReply({ content: null, embeds: [errorEmbed], components: [] });
          }
        }
      } else {
        await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({ embeds: [embed], components: [] });
      }
    });
  } catch (error) {
    console.error('Error al realizar el commit:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('❌ Error')
      .setDescription(`Hubo un error al realizar el commit: ${error.message}`)
      .setTimestamp();
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handlePush(interaction, git) {
  try {
    await interaction.deferReply();
    
    // Verificamos si hay commits para subir
    const status = await git.status();
    
    if (status.ahead === 0) {
      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('⚠️ Aviso')
        .setDescription('No hay commits locales para subir al repositorio remoto.')
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    await interaction.editReply({ content: '🚀 Subiendo commits al repositorio remoto...' });
    
    // Hacemos el push
    await git.push();
    
    // Obtenemos la información de los commits subidos
    const log = await git.log({ maxCount: status.ahead });
    
    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Push Completado')
      .setDescription(`Se han subido ${status.ahead} commit(s) al repositorio remoto.`)
      .addFields(
        { name: 'Commits Subidos', value: log.all.map(commit => `\`${commit.hash.substring(0, 7)}\` ${commit.message.substring(0, 50)}`).join('\n'), inline: false }
      )
      .setTimestamp();
    
    await interaction.editReply({ content: null, embeds: [embed] });
  } catch (error) {
    console.error('Error al hacer push:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('❌ Error')
      .setDescription(`Hubo un error al subir los cambios: ${error.message}`)
      .setTimestamp();
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleReset(interaction, git) {
  const modo = interaction.options.getString('modo') || 'hard';
  
  try {
    const confirmationEmbed = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle('⚠️ Confirmar Reset')
      .setDescription(`¿Estás seguro de que quieres revertir los cambios (modo: ${modo})?`)
      .addFields(
        { name: 'Modo seleccionado', value: modo === 'soft' ? 'Soft: Conserva los cambios en el área de trabajo' : modo === 'mixed' ? 'Mixed: Conserva los cambios sin staged' : 'Hard: Elimina todos los cambios', inline: false },
        { name: '⚠️ Advertencia', value: 'Esta acción no se puede deshacer.', inline: false }
      );
    
    const confirmationButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirmar-reset')
          .setLabel('Confirmar')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancelar-reset')
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Secondary)
      );
    
    const response = await interaction.reply({ embeds: [confirmationEmbed], components: [confirmationButtons], fetchReply: true });
    
    const collector = response.createMessageComponentCollector({ time: 60000 });
    
    collector.on('collect', async i => {
      if (i.user.id === interaction.user.id) {
        if (i.customId === 'confirmar-reset') {
          await i.update({ content: '🔄 Revirtiendo cambios...', embeds: [], components: [] });
          
          try {
            await git.reset([`--${modo}`]);
            
            const embed = new EmbedBuilder()
              .setColor('Green')
              .setTitle('✅ Reset Completado')
              .setDescription(`Se han revertido los cambios al último commit (modo: ${modo}).`)
              .setTimestamp();
            
            await interaction.editReply({ content: null, embeds: [embed], components: [] });
          } catch (error) {
            console.error('Error al hacer reset:', error);
            const errorEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('❌ Error al revertir cambios')
              .setDescription(`Hubo un error al revertir los cambios: ${error.message}`)
              .setTimestamp();
            await interaction.editReply({ content: null, embeds: [errorEmbed], components: [] });
          }
        } else if (i.customId === 'cancelar-reset') {
          await i.update({ content: '❌ Reset cancelado.', embeds: [], components: [] });
        }
      } else {
        await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({ content: '⏱️ Se agotó el tiempo de espera. Reset cancelado.', embeds: [], components: [] });
      }
    });
  } catch (error) {
    console.error('Error en el reset:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('❌ Error')
      .setDescription(`Hubo un error al revertir los cambios: ${error.message}`)
      .setTimestamp();
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

async function handleLog(interaction, git) {
  try {
    await interaction.deferReply();
    
    const cantidad = interaction.options.getInteger('cantidad') || 10;
    
    const log = await git.log({ maxCount: cantidad });
    
    if (log.all.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('📋 Historial de Commits')
        .setDescription('No hay commits en este repositorio.')
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      return;
    }
    
    // Organizamos los commits por fecha
    const formatCommit = commit => {
      return `**[\`${commit.hash.substring(0, 7)}\`](https://github.com/${commit.author_name}/MoonLigth/commit/${commit.hash})** - ${commit.message}\n👤 ${commit.author_name} • 🕒 <t:${Math.floor(commit.date.getTime() / 1000)}:R>`;
    };
    
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('📋 Historial de Commits')
      .setDescription(log.all.map(formatCommit).join('\n\n'))
      .setFooter({ text: `Mostrando ${log.all.length} commits de ${cantidad} solicitados` })
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error al obtener el historial de commits:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('❌ Error')
      .setDescription(`Hubo un error al obtener el historial de commits: ${error.message}`)
      .setTimestamp();
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
