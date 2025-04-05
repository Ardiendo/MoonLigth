
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('minijuegos')
    .setDescription('Juega a varios minijuegos.'),

  async execute(interaction) {
    try {
      // Embed principal
      const mainEmbed = new EmbedBuilder()
        .setColor('Random')
        .setTitle('🎮 Minijuegos')
        .setDescription('Selecciona un juego del menú para comenzar a jugar.')
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // Menú desplegable
      const menu = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('minijuegos-menu')
            .setPlaceholder('Selecciona un juego')
            .addOptions([
              {
                label: 'Blackjack',
                description: 'Juega al Blackjack contra el bot',
                value: 'blackjack',
                emoji: '🃏'
              },
              {
                label: 'Piedra, Papel o Tijera',
                description: 'Juega a Piedra, Papel o Tijera contra el bot',
                value: 'ppt',
                emoji: '✂️'
              },
              {
                label: 'Adivina el Número',
                description: 'Intenta adivinar un número aleatorio',
                value: 'adivina',
                emoji: '🔢'
              },
              {
                label: 'Ahorcado',
                description: 'Juega al ahorcado',
                value: 'ahorcado',
                emoji: '📝'
              },
              {
                label: 'Trivia',
                description: 'Responde preguntas de trivia',
                value: 'trivia',
                emoji: '❓'
              }
            ])
        );

      const response = await interaction.reply({
        embeds: [mainEmbed],
        components: [menu],
        fetchReply: true
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          await i.deferUpdate();
          
          const selectedGame = i.values[0];
          
          switch (selectedGame) {
            case 'blackjack':
              await playBlackjack(i);
              break;
            case 'ppt':
              await playPPT(i);
              break;
            case 'adivina':
              await playAdivinaNumero(i);
              break;
            case 'ahorcado':
              await playAhorcado(i);
              break;
            case 'trivia':
              await playTrivia(i);
              break;
          }
        } else {
          await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          const expiredEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('🎮 Minijuegos')
            .setDescription('El menú ha expirado. Usa el comando `/minijuegos` nuevamente para jugar.')
            .setTimestamp();
          
          interaction.editReply({ embeds: [expiredEmbed], components: [] }).catch(() => {});
        }
        console.log(`Se recogieron ${collected.size} interacciones.`);
      });

    } catch (error) {
      console.error('Error al ejecutar el comando:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Error')
        .setDescription('Hubo un error al ejecutar el comando. Por favor, inténtalo de nuevo más tarde.');
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};

// Función para jugar al Blackjack
async function playBlackjack(interaction) {
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
      .setColor('Random')
      .setTitle('🃏 Blackjack')
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

    await interaction.editReply({ embeds: [embed], components: [botones] });

    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({ time: 60000 });

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
  } catch (error) {
    console.error('Error al jugar Blackjack:', error);
    await interaction.editReply({ 
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Error')
          .setDescription('Hubo un error al jugar Blackjack.')
      ], 
      components: [] 
    });
  }
}

// Función para jugar a Piedra, Papel o Tijera
async function playPPT(interaction) {
  try {
    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTitle('✂️ Piedra, Papel o Tijera')
      .setDescription('Elige una opción para jugar:');

    const botones = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('piedra')
          .setLabel('Piedra')
          .setEmoji('🪨')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('papel')
          .setLabel('Papel')
          .setEmoji('📝')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('tijera')
          .setLabel('Tijera')
          .setEmoji('✂️')
          .setStyle(ButtonStyle.Primary),
      );

    await interaction.editReply({ embeds: [embed], components: [botones] });

    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
      if (i.user.id === interaction.user.id) {
        const opciones = ['piedra', 'papel', 'tijera'];
        const botEleccion = opciones[Math.floor(Math.random() * 3)];
        const playerEleccion = i.customId;
        
        let resultado;
        let emoji;
        
        if (playerEleccion === botEleccion) {
          resultado = 'Empate';
          emoji = '🔄';
        } else if (
          (playerEleccion === 'piedra' && botEleccion === 'tijera') ||
          (playerEleccion === 'papel' && botEleccion === 'piedra') ||
          (playerEleccion === 'tijera' && botEleccion === 'papel')
        ) {
          resultado = '¡Has ganado!';
          emoji = '🏆';
        } else {
          resultado = 'Has perdido';
          emoji = '😢';
        }
        
        const emojiMap = {
          piedra: '🪨',
          papel: '📝',
          tijera: '✂️'
        };
        
        embed.setDescription(`
          **Tu elección:** ${playerEleccion} ${emojiMap[playerEleccion]}
          **Elección del bot:** ${botEleccion} ${emojiMap[botEleccion]}
          
          ${emoji} **Resultado:** ${resultado}
        `);
        
        await i.update({ embeds: [embed], components: [] });
        collector.stop();
      } else {
        await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        embed.setDescription('Se acabó el tiempo. Vuelve a intentarlo.');
        interaction.editReply({ embeds: [embed], components: [] }).catch(() => {});
      }
    });
  } catch (error) {
    console.error('Error al jugar Piedra, Papel o Tijera:', error);
    await interaction.editReply({ 
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Error')
          .setDescription('Hubo un error al jugar Piedra, Papel o Tijera.')
      ], 
      components: [] 
    });
  }
}

// Función para jugar Adivina el Número
async function playAdivinaNumero(interaction) {
  try {
    const numeroSecreto = Math.floor(Math.random() * 100) + 1;
    let intentos = 0;
    const maxIntentos = 7;
    
    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTitle('🔢 Adivina el Número')
      .setDescription(`
        He pensado en un número entre 1 y 100.
        Tienes ${maxIntentos} intentos para adivinarlo.
        
        Escribe tu intento utilizando el botón de abajo.
      `);
    
    const botones = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('adivinar')
          .setLabel('Hacer un intento')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('rendirse')
          .setLabel('Rendirse')
          .setStyle(ButtonStyle.Danger)
      );
    
    await interaction.editReply({ embeds: [embed], components: [botones] });
    
    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({ time: 120000 });
    
    collector.on('collect', async i => {
      if (i.user.id === interaction.user.id) {
        if (i.customId === 'rendirse') {
          embed.setDescription(`
            Te has rendido.
            El número era ${numeroSecreto}.
          `);
          await i.update({ embeds: [embed], components: [] });
          collector.stop();
          return;
        }
        
        await i.showModal({
          title: "Adivina el Número",
          custom_id: "guess-modal",
          components: [{
            type: 1,
            components: [{
              type: 4,
              custom_id: "numero",
              label: "Escribe un número del 1 al 100",
              style: 1,
              min_length: 1,
              max_length: 3,
              placeholder: "Escribe tu intento aquí",
              required: true
            }]
          }]
        });
        
        try {
          const modalResponse = await i.awaitModalSubmit({ time: 60000, filter: m => m.user.id === i.user.id });
          
          const guess = parseInt(modalResponse.fields.getTextInputValue('numero'));
          
          intentos++;
          
          if (isNaN(guess) || guess < 1 || guess > 100) {
            embed.setDescription(`
              Por favor, ingresa un número válido entre 1 y 100.
              Tienes ${maxIntentos - intentos} intentos restantes.
            `);
            await modalResponse.update({ embeds: [embed], components: [botones] });
            return;
          }
          
          let message = '';
          
          if (guess === numeroSecreto) {
            message = `
              🎉 ¡Felicidades! Has adivinado el número ${numeroSecreto}.
              Intentos utilizados: ${intentos}/${maxIntentos}
            `;
            await modalResponse.update({ embeds: [embed.setDescription(message)], components: [] });
            collector.stop();
          } else if (intentos >= maxIntentos) {
            message = `
              ❌ Se acabaron tus intentos.
              El número era ${numeroSecreto}.
            `;
            await modalResponse.update({ embeds: [embed.setDescription(message)], components: [] });
            collector.stop();
          } else {
            const pista = guess < numeroSecreto ? 'mayor' : 'menor';
            message = `
              Tu intento: ${guess}
              El número es ${pista} que tu intento.
              Tienes ${maxIntentos - intentos} intentos restantes.
            `;
            await modalResponse.update({ embeds: [embed.setDescription(message)], components: [botones] });
          }
        } catch (error) {
          console.error('Error en la respuesta modal:', error);
        }
      } else {
        await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        embed.setDescription(`Se acabó el tiempo. El número era ${numeroSecreto}.`);
        interaction.editReply({ embeds: [embed], components: [] }).catch(() => {});
      }
    });
  } catch (error) {
    console.error('Error al jugar Adivina el Número:', error);
    await interaction.editReply({ 
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Error')
          .setDescription('Hubo un error al jugar Adivina el Número.')
      ], 
      components: [] 
    });
  }
}

// Función para jugar al Ahorcado
async function playAhorcado(interaction) {
  try {
    const palabras = [
      'javascript', 'programacion', 'discord', 'moonligth', 'videojuego',
      'computadora', 'internet', 'desarrollo', 'tecnologia', 'algoritmo',
      'aplicacion', 'servidor', 'cliente', 'interfaz', 'codigo'
    ];
    
    const palabra = palabras[Math.floor(Math.random() * palabras.length)];
    let adivinadas = Array(palabra.length).fill('_');
    let intentosFallidos = 0;
    const maxIntentos = 6;
    const letrasUsadas = new Set();
    
    const estados = [
      '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```',
      '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```',
      '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```',
      '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```',
      '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```',
      '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```',
      '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```'
    ];
    
    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTitle('📝 Ahorcado')
      .setDescription(`
        ${estados[intentosFallidos]}
        
        Palabra: ${adivinadas.join(' ')}
        
        Letras usadas: ${Array.from(letrasUsadas).join(', ') || 'Ninguna'}
        
        Intentos restantes: ${maxIntentos - intentosFallidos}
      `);
    
    const botones = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('adivinar-letra')
          .setLabel('Adivinar Letra')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('adivinar-palabra')
          .setLabel('Adivinar Palabra')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('rendirse-ahorcado')
          .setLabel('Rendirse')
          .setStyle(ButtonStyle.Danger)
      );
    
    await interaction.editReply({ embeds: [embed], components: [botones] });
    
    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({ time: 180000 });
    
    collector.on('collect', async i => {
      if (i.user.id === interaction.user.id) {
        if (i.customId === 'rendirse-ahorcado') {
          embed.setDescription(`
            ${estados[6]}
            
            Te has rendido.
            La palabra era: **${palabra}**
          `);
          await i.update({ embeds: [embed], components: [] });
          collector.stop();
          return;
        }
        
        if (i.customId === 'adivinar-letra') {
          await i.showModal({
            title: "Adivinar Letra",
            custom_id: "letra-modal",
            components: [{
              type: 1,
              components: [{
                type: 4,
                custom_id: "letra",
                label: "Escribe una letra",
                style: 1,
                min_length: 1,
                max_length: 1,
                placeholder: "Escribe una letra aquí",
                required: true
              }]
            }]
          });
          
          try {
            const modalResponse = await i.awaitModalSubmit({ time: 60000, filter: m => m.user.id === i.user.id });
            
            const letra = modalResponse.fields.getTextInputValue('letra').toLowerCase();
            
            if (!/^[a-z]$/.test(letra)) {
              embed.setDescription(`
                ${estados[intentosFallidos]}
                
                Por favor, ingresa una letra válida.
                
                Palabra: ${adivinadas.join(' ')}
                
                Letras usadas: ${Array.from(letrasUsadas).join(', ') || 'Ninguna'}
                
                Intentos restantes: ${maxIntentos - intentosFallidos}
              `);
              await modalResponse.update({ embeds: [embed], components: [botones] });
              return;
            }
            
            if (letrasUsadas.has(letra)) {
              embed.setDescription(`
                ${estados[intentosFallidos]}
                
                Ya has usado la letra "${letra}".
                
                Palabra: ${adivinadas.join(' ')}
                
                Letras usadas: ${Array.from(letrasUsadas).join(', ')}
                
                Intentos restantes: ${maxIntentos - intentosFallidos}
              `);
              await modalResponse.update({ embeds: [embed], components: [botones] });
              return;
            }
            
            letrasUsadas.add(letra);
            
            let acierto = false;
            for (let i = 0; i < palabra.length; i++) {
              if (palabra[i] === letra) {
                adivinadas[i] = letra;
                acierto = true;
              }
            }
            
            if (!acierto) {
              intentosFallidos++;
            }
            
            // Comprobar si se ha ganado
            if (!adivinadas.includes('_')) {
              embed.setDescription(`
                ¡Felicidades! Has adivinado la palabra: **${palabra}**
              `);
              await modalResponse.update({ embeds: [embed], components: [] });
              collector.stop();
              return;
            }
            
            // Comprobar si se ha perdido
            if (intentosFallidos >= maxIntentos) {
              embed.setDescription(`
                ${estados[6]}
                
                ¡Has perdido! La palabra era: **${palabra}**
              `);
              await modalResponse.update({ embeds: [embed], components: [] });
              collector.stop();
              return;
            }
            
            embed.setDescription(`
              ${estados[intentosFallidos]}
              
              Palabra: ${adivinadas.join(' ')}
              
              Letras usadas: ${Array.from(letrasUsadas).join(', ')}
              
              Intentos restantes: ${maxIntentos - intentosFallidos}
            `);
            await modalResponse.update({ embeds: [embed], components: [botones] });
          } catch (error) {
            console.error('Error en la respuesta modal:', error);
          }
        }
        
        if (i.customId === 'adivinar-palabra') {
          await i.showModal({
            title: "Adivinar Palabra",
            custom_id: "palabra-modal",
            components: [{
              type: 1,
              components: [{
                type: 4,
                custom_id: "palabra-completa",
                label: "Escribe la palabra completa",
                style: 1,
                min_length: 1,
                max_length: 20,
                placeholder: "Escribe tu respuesta aquí",
                required: true
              }]
            }]
          });
          
          try {
            const modalResponse = await i.awaitModalSubmit({ time: 60000, filter: m => m.user.id === i.user.id });
            
            const palabraAdivinada = modalResponse.fields.getTextInputValue('palabra-completa').toLowerCase();
            
            if (palabraAdivinada === palabra) {
              embed.setDescription(`
                ¡Felicidades! Has adivinado la palabra: **${palabra}**
              `);
              await modalResponse.update({ embeds: [embed], components: [] });
              collector.stop();
            } else {
              intentosFallidos = maxIntentos;
              embed.setDescription(`
                ${estados[6]}
                
                Incorrecto. La palabra era: **${palabra}**
              `);
              await modalResponse.update({ embeds: [embed], components: [] });
              collector.stop();
            }
          } catch (error) {
            console.error('Error en la respuesta modal:', error);
          }
        }
      } else {
        await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        embed.setDescription(`
          Se acabó el tiempo. 
          La palabra era: **${palabra}**
        `);
        interaction.editReply({ embeds: [embed], components: [] }).catch(() => {});
      }
    });
  } catch (error) {
    console.error('Error al jugar al Ahorcado:', error);
    await interaction.editReply({ 
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Error')
          .setDescription('Hubo un error al jugar al Ahorcado.')
      ], 
      components: [] 
    });
  }
}

// Función para jugar a Trivia
async function playTrivia(interaction) {
  try {
    const preguntas = [
      {
        pregunta: "¿Cuál es el planeta más grande del sistema solar?",
        opciones: ["Tierra", "Júpiter", "Saturno", "Marte"],
        respuesta: 1
      },
      {
        pregunta: "¿Quién escribió 'Don Quijote de la Mancha'?",
        opciones: ["Federico García Lorca", "Miguel de Cervantes", "Gabriel García Márquez", "Pablo Neruda"],
        respuesta: 1
      },
      {
        pregunta: "¿Cuál es el océano más grande del mundo?",
        opciones: ["Atlántico", "Índico", "Pacífico", "Ártico"],
        respuesta: 2
      },
      {
        pregunta: "¿En qué año se descubrió América?",
        opciones: ["1492", "1592", "1392", "1500"],
        respuesta: 0
      },
      {
        pregunta: "¿Cuál es el elemento químico con símbolo 'O'?",
        opciones: ["Oro", "Osmio", "Oxígeno", "Oganesón"],
        respuesta: 2
      }
    ];
    
    const preguntaRandom = preguntas[Math.floor(Math.random() * preguntas.length)];
    
    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTitle('❓ Trivia')
      .setDescription(`
        **Pregunta:** ${preguntaRandom.pregunta}
        
        Selecciona la respuesta correcta:
      `);
    
    const botones = new ActionRowBuilder()
      .addComponents(
        preguntaRandom.opciones.map((opcion, index) => 
          new ButtonBuilder()
            .setCustomId(`opcion-${index}`)
            .setLabel(opcion)
            .setStyle(ButtonStyle.Primary)
        )
      );
    
    await interaction.editReply({ embeds: [embed], components: [botones] });
    
    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({ time: 30000 });
    
    collector.on('collect', async i => {
      if (i.user.id === interaction.user.id) {
        const seleccion = parseInt(i.customId.split('-')[1]);
        
        const nuevosComponentes = new ActionRowBuilder()
          .addComponents(
            preguntaRandom.opciones.map((opcion, index) => 
              new ButtonBuilder()
                .setCustomId(`opcion-${index}`)
                .setLabel(opcion)
                .setStyle(index === preguntaRandom.respuesta 
                  ? ButtonStyle.Success 
                  : (index === seleccion && seleccion !== preguntaRandom.respuesta) 
                    ? ButtonStyle.Danger 
                    : ButtonStyle.Secondary)
                .setDisabled(true)
            )
          );
        
        if (seleccion === preguntaRandom.respuesta) {
          embed.setDescription(`
            **Pregunta:** ${preguntaRandom.pregunta}
            
            ✅ ¡Correcto! La respuesta es: ${preguntaRandom.opciones[preguntaRandom.respuesta]}
          `);
        } else {
          embed.setDescription(`
            **Pregunta:** ${preguntaRandom.pregunta}
            
            ❌ Incorrecto. La respuesta correcta es: ${preguntaRandom.opciones[preguntaRandom.respuesta]}
          `);
        }
        
        await i.update({ embeds: [embed], components: [nuevosComponentes] });
        collector.stop();
      } else {
        await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        const nuevosComponentes = new ActionRowBuilder()
          .addComponents(
            preguntaRandom.opciones.map((opcion, index) => 
              new ButtonBuilder()
                .setCustomId(`opcion-${index}`)
                .setLabel(opcion)
                .setStyle(index === preguntaRandom.respuesta ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(true)
            )
          );
        
        embed.setDescription(`
          **Pregunta:** ${preguntaRandom.pregunta}
          
          ⏱️ Se acabó el tiempo. La respuesta correcta es: ${preguntaRandom.opciones[preguntaRandom.respuesta]}
        `);
        
        interaction.editReply({ embeds: [embed], components: [nuevosComponentes] }).catch(() => {});
      }
    });
  } catch (error) {
    console.error('Error al jugar a Trivia:', error);
    await interaction.editReply({ 
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Error')
          .setDescription('Hubo un error al jugar a Trivia.')
      ], 
      components: [] 
    });
  }
}
