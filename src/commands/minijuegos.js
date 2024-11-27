const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('minijuegos')
    .setDescription('Juega a minijuegos.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('blackjack')
        .setDescription('Juega al Blackjack contra el bot.'))
    
    ,

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'blackjack') {
      try {
        let jugadorMano = [];
        let botMano = [];
        let baraja = [];

        
        function crearBaraja() {
          const palos = ['♥', '♦', '♣', '♠'];
          const valores = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
          baraja = [];
          for (const palo of palos) {
            for (const valor of valores) {
              baraja.push(`${valor}${palo}`);
            }
          }
        }

        
        function valorCarta(carta) {
          const valor = carta.substring(0, carta.length - 1);
          if (valor === 'A') {
            return 11; 
          } else if (['J', 'Q', 'K'].includes(valor)) {
            return 10;
          } else {
            return parseInt(valor);
          }
        }

        
        function calcularMano(mano) {
          let total = 0;
          let tieneAs = false;
          for (const carta of mano) {
            total += valorCarta(carta);
            if (valorCarta(carta) === 11) {
              tieneAs = true;
            }
          }
          
          while (total > 21 && tieneAs) {
            total -= 10;
            tieneAs = false;
          }
          return total;
        }

        
        function repartirCarta() {
          const indiceAleatorio = Math.floor(Math.random() * baraja.length);
          const carta = baraja.splice(indiceAleatorio, 1)[0];
          return carta;
        }

        
        crearBaraja();
        jugadorMano.push(repartirCarta(), repartirCarta());
        botMano.push(repartirCarta(), repartirCarta());

        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle('Blackjack')
          .setDescription(`
            **Tu mano:** ${jugadorMano.join(' ')} (${calcularMano(jugadorMano)})\n
            **Mano del bot:** ${botMano[0]} ?
          `);

        const botones = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('pedir')
              .setLabel('Pedir carta')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('plantarse')
              .setLabel('Plantarse')
              .setStyle(ButtonStyle.Secondary),
          );

        const reply = await interaction.reply({ embeds: [embed], components: [botones] });

        const collector = reply.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
          if (i.user.id === interaction.user.id) {
            if (i.customId === 'pedir') {
              jugadorMano.push(repartirCarta());
              const jugadorTotal = calcularMano(jugadorMano);

              if (jugadorTotal > 21) {
                embed.setDescription(`
                  **Tu mano:** ${jugadorMano.join(' ')} (${jugadorTotal})\n
                  **Mano del bot:** ${botMano.join(' ')} (${calcularMano(botMano)})\n
                  ¡Te has pasado! Has perdido.
                `);
                await i.update({ embeds: [embed], components: [] });
                collector.stop();
              } else {
                embed.setDescription(`
                  **Tu mano:** ${jugadorMano.join(' ')} (${jugadorTotal})\n
                  **Mano del bot:** ${botMano[0]} ?
                `);
                await i.update({ embeds: [embed] });
              }
            } else if (i.customId === 'plantarse') {
              let botTotal = calcularMano(botMano);
              while (botTotal < 17) {
                botMano.push(repartirCarta());
                botTotal = calcularMano(botMano);
              }

              embed.setDescription(`
                **Tu mano:** ${jugadorMano.join(' ')} (${calcularMano(jugadorMano)})\n
                **Mano del bot:** ${botMano.join(' ')} (${botTotal})\n
                ${
                  botTotal > 21
                    ? "¡El bot se ha pasado! Has ganado."
                    : calcularMano(jugadorMano) > botTotal
                      ? "Has ganado."
                      : calcularMano(jugadorMano) === botTotal
                        ? "Empate."
                        : "Has perdido."
                }
              `);
              await i.update({ embeds: [embed], components: [] });
              collector.stop();
            }
          } else {
            await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
          }
        });

        collector.on('end', collected => console.log(`Se recogieron ${collected.size} interacciones.`));

      } catch (error) {
        console.error('Error al ejecutar el comando:', error);
        const errorEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Error')
          .setDescription('Hubo un error al ejecutar el comando. Por favor, inténtalo de nuevo más tarde.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};