const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

// --- Main Command Execution ---
module.exports = {
    data: new SlashCommandBuilder()
        .setName('minijuegos')
        .setDescription('Juega a varios minijuegos.'),

    async execute(interaction) {
        try {
            await displayMainMenu(interaction); // Call the refactored main menu function
        } catch (error) {
            console.error('Error al ejecutar el comando /minijuegos:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Error')
                .setDescription('Hubo un error al iniciar el menú de minijuegos. Por favor, inténtalo de nuevo más tarde.');

            // Try to reply or follow up depending on interaction state
             if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
            }
        }
    },
};

// --- Helper Function: Display Main Menu ---
async function displayMainMenu(interaction, isUpdate = false) {
    try {
        const mainEmbed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('🎮 Minijuegos')
            .setDescription('Selecciona un juego del menú para comenzar a jugar.')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        const menu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('minijuegos-menu')
                    .setPlaceholder('Selecciona un juego')
                    .addOptions([
                        { label: 'Blackjack', description: 'Juega al Blackjack contra el bot', value: 'blackjack', emoji: '🃏' },
                        { label: 'Piedra, Papel o Tijera', description: 'Juega a Piedra, Papel o Tijera contra el bot', value: 'ppt', emoji: '✂️' },
                        { label: 'Adivina el Número', description: 'Intenta adivinar un número aleatorio', value: 'adivina', emoji: '🔢' },
                        { label: 'Ahorcado', description: 'Juega al ahorcado', value: 'ahorcado', emoji: '📝' },
                        { label: 'Trivia', description: 'Responde preguntas de trivia', value: 'trivia', emoji: '❓' }
                    ])
            );

        const messagePayload = {
            embeds: [mainEmbed],
            components: [menu],
            fetchReply: true // Needed to attach collector later
        };

        let response;
        if (isUpdate) {
            // If called from a button click (like "Main Menu"), update the existing message
            response = await interaction.update(messagePayload);
        } else {
            // If called initially or after "Play Again", send a new reply (or edit the deferred one)
             if (interaction.replied || interaction.deferred) {
                 response = await interaction.editReply(messagePayload);
             } else {
                 response = await interaction.reply(messagePayload);
             }
        }
        // Fetch the message object if interaction.update doesn't return it directly in your d.js version
        const message = await interaction.channel.messages.fetch(response.id); 

        // --- Main Menu Collector ---
        // Use filter to ensure only the original user interacts
        const filter = (i) => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            filter,
            time: 60000 // 60 seconds timeout for selection
        });

        collector.on('collect', async i => {
            // No need to check i.user.id again because filter handles it
            await i.deferUpdate(); // Acknowledge the interaction immediately

            const selectedGame = i.values[0];

            // Stop the main menu collector once a game is chosen
            collector.stop('gameSelected'); 

            switch (selectedGame) {
                case 'blackjack':
                    await playBlackjack(i); // Pass the selection interaction 'i'
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
        });

        collector.on('end', (collected, reason) => {
            // Only show timeout message if no game was selected
            if (reason !== 'gameSelected' && collected.size === 0) {
                 const expiredEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('🎮 Minijuegos')
                    .setDescription('El menú de selección ha expirado. Usa el comando `/minijuegos` nuevamente para jugar.')
                    .setTimestamp();
                interaction.editReply({ embeds: [expiredEmbed], components: [] }).catch(() => { /* Ignore errors if message is deleted */ });
            }
             // If a game was selected, the components will be handled by the game function
             else if (reason === 'gameSelected') {
                 // Optionally disable the select menu after selection if needed, though starting the game usually replaces it.
                 // interaction.editReply({ components: [] }).catch(()=>{}); // Might cause issues if game function edits immediately
             }
            console.log(`Main menu collector ended. Reason: ${reason || 'timeout'}. Collected ${collected.size} interactions.`);
        });

    } catch (error) {
         console.error('Error displaying main menu:', error);
         const errorEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Error')
            .setDescription('Hubo un error al mostrar el menú principal.');
         // Use interaction.followUp if the initial reply/deferral succeeded
         if (interaction.replied || interaction.deferred) {
             await interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
         } else {
             // Otherwise, try to reply (this might fail if interaction expired)
             await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
         }
    }
}


// --- Helper Function: Show End Game Options ---
async function showEndGameOptions(interaction, gameType, finalEmbed) {
    try {
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`play-again-${gameType}`)
                    .setLabel('Volver a Jugar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('main-menu')
                    .setLabel('Menú Principal')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Update the message with the final game embed and the new buttons
        const message = await interaction.editReply({
             embeds: [finalEmbed], 
             components: [actionRow],
             fetchReply: true // Ensure we get the message object
        });

        // Collector for the "Play Again" / "Main Menu" buttons
        const filter = (i) => i.user.id === interaction.user.id; // Only original user
        const endCollector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter,
            time: 60000 // 60 seconds timeout for post-game choice
        });

        endCollector.on('collect', async i => {
            endCollector.stop('buttonClicked'); // Stop listening once a button is clicked
            await i.deferUpdate(); // Acknowledge button click

            if (i.customId === `play-again-${gameType}`) {
                // Call the specific game function again, passing the button interaction 'i'
                switch (gameType) {
                    case 'blackjack': await playBlackjack(i); break;
                    case 'ppt': await playPPT(i); break;
                    case 'adivina': await playAdivinaNumero(i); break;
                    case 'ahorcado': await playAhorcado(i); break;
                    case 'trivia': await playTrivia(i); break;
                }
            } else if (i.customId === 'main-menu') {
                // Display the main selection menu again
                await displayMainMenu(i, true); // Pass 'true' to indicate it's an update
            }
        });

        endCollector.on('end', (collected, reason) => {
            // If the collector times out (no button clicked), disable the buttons
            if (reason !== 'buttonClicked') {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        ButtonBuilder.from(actionRow.components[0]).setDisabled(true), // Play Again disabled
                        ButtonBuilder.from(actionRow.components[1]).setDisabled(true)  // Main Menu disabled
                    );
                interaction.editReply({ components: [disabledRow] }).catch(() => { /* Ignore errors */ });
            }
             console.log(`End game collector ended for ${gameType}. Reason: ${reason || 'timeout'}. Collected: ${collected.size}`);
        });

    } catch (error) {
        console.error(`Error in showEndGameOptions for ${gameType}:`, error);
        // Attempt to notify the user about the error in the post-game options phase
        try {
             await interaction.followUp({ content: 'Error al mostrar las opciones de fin de juego.', ephemeral: true });
        } catch (e) { // Handle cases where interaction might be too old
            console.error("Failed to send follow-up error for end game options:", e)
        }
    }
}


// --- Blackjack Game ---
async function playBlackjack(interaction) {
    try {
        let jugadorMano = [];
        let botMano = [];
        let baraja = [];

        function crearBaraja() { baraja = []; const p=['♥','♦','♣','♠'], v=['A','2','3','4','5','6','7','8','9','10','J','Q','K']; p.forEach(p=>v.forEach(v=>baraja.push(`${v}${p}`))); baraja.sort(()=>Math.random()-0.5); } // Shuffled
        function valorCarta(c) { const v=c.slice(0,-1); if(v==='A') return 11; if(['J','Q','K'].includes(v)) return 10; return parseInt(v);}
        function calcularMano(mano) { let t=0,a=0; mano.forEach(c=>{let val=valorCarta(c); t+=val; if(val===11)a++;}); while(t>21&&a>0){t-=10;a--;} return t;}
        function repartirCarta() { return baraja.pop(); } // More efficient than splice

        crearBaraja();
        jugadorMano.push(repartirCarta(), repartirCarta());
        botMano.push(repartirCarta(), repartirCarta());

        let jugadorTotal = calcularMano(jugadorMano);
        let botTotal = calcularMano(botMano); // Calculate initial bot total for potential immediate Blackjack

        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('🃏 Blackjack')
            .setDescription(`**Tu mano:** ${jugadorMano.join(' ')} (${jugadorTotal})\n**Mano del bot:** ${botMano[0]} ?`);

        const botones = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('pedir').setLabel('Pedir carta').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('plantarse').setLabel('Plantarse').setStyle(ButtonStyle.Secondary),
            );

        // Initial reply or update
        // Need to handle if interaction is from 'play again' button (already deferred/replied)
        let message;
        if (interaction.isButton() || interaction.isStringSelectMenu()) { // Check if it's a component interaction
             message = await interaction.editReply({ embeds: [embed], components: [botones], fetchReply: true });
        } else { // Should not happen with current flow, but safe fallback
             message = await interaction.reply({ embeds: [embed], components: [botones], fetchReply: true });
        }

        // Check for immediate Blackjacks
        if (jugadorTotal === 21 || botTotal === 21) {
            let resultText = `**Tu mano:** ${jugadorMano.join(' ')} (${jugadorTotal})\n**Mano del bot:** ${botMano.join(' ')} (${botTotal})\n\n`;
            if (jugadorTotal === 21 && botTotal === 21) resultText += "¡Doble Blackjack! Empate.";
            else if (jugadorTotal === 21) resultText += "¡Blackjack! Has ganado.";
            else resultText += "¡Blackjack del Bot! Has perdido.";

            embed.setDescription(resultText);
            await showEndGameOptions(interaction, 'blackjack', embed); // Use helper function
            return; // End game immediately
        }

        // --- Blackjack Game Collector ---
        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, filter, time: 60000 });

        collector.on('collect', async i => {
            await i.deferUpdate(); // Acknowledge button press

            if (i.customId === 'pedir') {
                jugadorMano.push(repartirCarta());
                jugadorTotal = calcularMano(jugadorMano); // Recalculate player total

                if (jugadorTotal > 21) {
                    embed.setDescription(`**Tu mano:** ${jugadorMano.join(' ')} (${jugadorTotal})\n**Mano del bot:** ${botMano.join(' ')} (${calcularMano(botMano)})\n\n¡Te has pasado! Has perdido.`);
                    collector.stop('playerBust');
                    await showEndGameOptions(i, 'blackjack', embed); // Show end options
                } else {
                    // Update embed, keep buttons active
                    embed.setDescription(`**Tu mano:** ${jugadorMano.join(' ')} (${jugadorTotal})\n**Mano del bot:** ${botMano[0]} ?`);
                    await i.editReply({ embeds: [embed], components: [botones] }); // Use editReply on the component interaction
                     // Reset collector timer on activity (optional)
                     // collector.resetTimer(); 
                }
            } else if (i.customId === 'plantarse') {
                collector.stop('playerStand'); // Stop collecting game actions

                // Bot's turn
                botTotal = calcularMano(botMano); // Ensure botTotal is current before loop
                while (botTotal < 17) {
                    botMano.push(repartirCarta());
                    botTotal = calcularMano(botMano);
                }

                // Determine winner
                let resultText = `**Tu mano:** ${jugadorMano.join(' ')} (${jugadorTotal})\n**Mano del bot:** ${botMano.join(' ')} (${botTotal})\n\n`;
                if (botTotal > 21) resultText += "¡El bot se ha pasado! Has ganado.";
                else if (jugadorTotal > botTotal) resultText += "¡Has ganado!";
                else if (jugadorTotal === botTotal) resultText += "Empate.";
                else resultText += "Has perdido.";

                embed.setDescription(resultText);
                await showEndGameOptions(i, 'blackjack', embed); // Show end options
            }
        });

        collector.on('end', (collected, reason) => {
             // Handle timeout only if game didn't end normally
            if (reason !== 'playerBust' && reason !== 'playerStand' && collected.size === 0) {
                 embed.setDescription(`**Tu mano:** ${jugadorMano.join(' ')} (${jugadorTotal})\n**Mano del bot:** ${botMano[0]} ?\n\n⏱️ Se acabó el tiempo. El juego ha sido cancelado.`);
                 // Use the original interaction context for timeout editReply if possible
                 interaction.editReply({ embeds: [embed], components: [] }).catch(() => {}); 
                 // No end game options on timeout cancellation
            }
            console.log(`Blackjack collector ended. Reason: ${reason || 'timeout'}. Collected: ${collected.size}`);
        });

    } catch (error) {
        console.error('Error al jugar Blackjack:', error);
        const errorEmbed = new EmbedBuilder().setColor('Red').setTitle('❌ Error').setDescription('Hubo un error al jugar Blackjack.');
        await interaction.editReply({ embeds: [errorEmbed], components: [] }).catch(()=>{}); // Try to edit reply
    }
}


// --- Piedra, Papel o Tijera (PPT) Game ---
async function playPPT(interaction) {
    try {
        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('✂️ Piedra, Papel o Tijera')
            .setDescription('Elige una opción para jugar:');

        const botones = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('piedra').setLabel('Piedra').setEmoji('🪨').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('papel').setLabel('Papel').setEmoji('📝').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('tijera').setLabel('Tijera').setEmoji('✂️').setStyle(ButtonStyle.Primary),
            );

        let message;
        if (interaction.isButton() || interaction.isStringSelectMenu()) {
            message = await interaction.editReply({ embeds: [embed], components: [botones], fetchReply: true });
        } else {
            message = await interaction.reply({ embeds: [embed], components: [botones], fetchReply: true });
        }

        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, filter, time: 30000 }); // 30 seconds

        collector.on('collect', async i => {
            collector.stop('choiceMade'); // Stop collector once choice is made
            await i.deferUpdate(); // Acknowledge

            const opciones = ['piedra', 'papel', 'tijera'];
            const botEleccion = opciones[Math.floor(Math.random() * 3)];
            const playerEleccion = i.customId;

            let resultado;
            let emoji;
            const emojiMap = { piedra: '🪨', papel: '📝', tijera: '✂️' };

            if (playerEleccion === botEleccion) { resultado = 'Empate'; emoji = '🔄'; }
            else if ((playerEleccion === 'piedra' && botEleccion === 'tijera') ||
                     (playerEleccion === 'papel' && botEleccion === 'piedra') ||
                     (playerEleccion === 'tijera' && botEleccion === 'papel')) {
                resultado = '¡Has ganado!'; emoji = '🏆';
            } else {
                resultado = 'Has perdido'; emoji = '😢';
            }

            embed.setDescription(`**Tu elección:** ${playerEleccion} ${emojiMap[playerEleccion]}\n**Elección del bot:** ${botEleccion} ${emojiMap[botEleccion]}\n\n${emoji} **Resultado:** ${resultado}`);

            await showEndGameOptions(i, 'ppt', embed); // Use helper function
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'choiceMade' && collected.size === 0) {
                embed.setDescription('⏱️ Se acabó el tiempo para elegir.');
                interaction.editReply({ embeds: [embed], components: [] }).catch(() => {});
                // No end game options on timeout
            }
            console.log(`PPT collector ended. Reason: ${reason || 'timeout'}. Collected: ${collected.size}`);
        });
    } catch (error) {
        console.error('Error al jugar PPT:', error);
         const errorEmbed = new EmbedBuilder().setColor('Red').setTitle('❌ Error').setDescription('Hubo un error al jugar Piedra, Papel o Tijera.');
        await interaction.editReply({ embeds: [errorEmbed], components: [] }).catch(()=>{});
    }
}

// --- Adivina el Número Game ---
async function playAdivinaNumero(interaction) {
    try {
        const numeroSecreto = Math.floor(Math.random() * 100) + 1;
        let intentos = 0;
        const maxIntentos = 7;

        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('🔢 Adivina el Número')
            .setDescription(`He pensado en un número entre 1 y 100.\nTienes ${maxIntentos} intentos para adivinarlo.\n\nUsa los botones de abajo.`);

        const botones = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('adivinar-num-btn').setLabel('Hacer un intento').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('rendirse-num-btn').setLabel('Rendirse').setStyle(ButtonStyle.Danger)
            );

        let message;
         if (interaction.isButton() || interaction.isStringSelectMenu()) {
            message = await interaction.editReply({ embeds: [embed], components: [botones], fetchReply: true });
        } else {
            message = await interaction.reply({ embeds: [embed], components: [botones], fetchReply: true });
        }

        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, filter, time: 120000 }); // 2 minutes

        collector.on('collect', async i => {
            if (i.customId === 'rendirse-num-btn') {
                collector.stop('surrender');
                await i.deferUpdate();
                embed.setDescription(`Te has rendido.\nEl número era **${numeroSecreto}**.`);
                await showEndGameOptions(i, 'adivina', embed);
                return;
            }

            if (i.customId === 'adivinar-num-btn') {
                // Show Modal
                const modal = new ModalBuilder()
                    .setCustomId(`guess-modal-${i.id}`) // Unique ID per interaction
                    .setTitle("Adivina el Número");

                const numberInput = new TextInputBuilder()
                    .setCustomId('numero-input')
                    .setLabel("Escribe un número del 1 al 100")
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(3)
                    .setPlaceholder("Tu intento")
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(numberInput));
                await i.showModal(modal);

                // Wait for Modal submission
                const modalFilter = (modalInteraction) => modalInteraction.customId === `guess-modal-${i.id}` && modalInteraction.user.id === i.user.id;
                try {
                    const modalResponse = await i.awaitModalSubmit({ filter: modalFilter, time: 60000 }); // 60s timeout for modal
                    await modalResponse.deferUpdate(); // Acknowledge modal submission

                    const guessStr = modalResponse.fields.getTextInputValue('numero-input');
                    const guess = parseInt(guessStr);

                    intentos++;
                    let messageText = '';

                    if (isNaN(guess) || guess < 1 || guess > 100) {
                         messageText = `"${guessStr}" no es un número válido entre 1 y 100.\nIntenta de nuevo. Tienes ${maxIntentos - intentos} intentos restantes.`;
                         if (intentos >= maxIntentos) {
                             collector.stop('invalidLastAttempt');
                              messageText = `"${guessStr}" no es un número válido.\n❌ Se acabaron tus intentos.\nEl número era **${numeroSecreto}**.`;
                              embed.setDescription(messageText);
                              await showEndGameOptions(modalResponse, 'adivina', embed); // Use modal interaction here
                         } else {
                              embed.setDescription(messageText);
                              await modalResponse.editReply({ embeds: [embed], components: [botones] }); // Update after invalid modal
                         }
                    } else if (guess === numeroSecreto) {
                        collector.stop('correctGuess');
                        messageText = `🎉 ¡Felicidades! Has adivinado el número **${numeroSecreto}**.\nIntentos utilizados: ${intentos}/${maxIntentos}`;
                        embed.setDescription(messageText);
                        await showEndGameOptions(modalResponse, 'adivina', embed);
                    } else if (intentos >= maxIntentos) {
                        collector.stop('maxAttempts');
                        messageText = `Tu último intento: ${guess}\n❌ Se acabaron tus intentos.\nEl número era **${numeroSecreto}**.`;
                        embed.setDescription(messageText);
                        await showEndGameOptions(modalResponse, 'adivina', embed);
                    } else {
                        const pista = guess < numeroSecreto ? 'mayor' : 'menor';
                        messageText = `Tu intento: ${guess}\nEl número es **${pista}** que tu intento.\nTienes ${maxIntentos - intentos} intentos restantes.`;
                        embed.setDescription(messageText);
                         await modalResponse.editReply({ embeds: [embed], components: [botones] }); // Update after guess modal
                         // collector.resetTimer(); // Optional: Reset button collector timer
                    }

                } catch (err) {
                     // Modal timeout or other error
                     console.log("Modal timed out or failed:", err);
                     // No update needed if modal just times out, button collector is still active unless main time runs out
                     // If it's another error, maybe stop the game.
                     if (!(err.code === 'InteractionCollectorError')) { // If not a standard timeout
                          collector.stop('modalError');
                          embed.setDescription('Hubo un problema al procesar tu intento.');
                          await interaction.editReply({ embeds: [embed], components:[]}).catch(()=>{}); // Edit original interaction reply
                     }
                }
            }
        });

        collector.on('end', (collected, reason) => {
            // Handle main button collector timeout only if game didn't end via other reasons
            if (!['surrender', 'correctGuess', 'maxAttempts', 'invalidLastAttempt', 'modalError'].includes(reason) && collected.size === 0) {
                 embed.setDescription(`⏱️ Se acabó el tiempo para jugar.\nEl número era **${numeroSecreto}**.`);
                 interaction.editReply({ embeds: [embed], components: [] }).catch(() => {});
                 // No end game options on timeout
            }
            console.log(`AdivinaNumero collector ended. Reason: ${reason || 'timeout'}. Collected: ${collected.size}`);
        });

    } catch (error) {
        console.error('Error al jugar Adivina el Número:', error);
        const errorEmbed = new EmbedBuilder().setColor('Red').setTitle('❌ Error').setDescription('Hubo un error al jugar Adivina el Número.');
         await interaction.editReply({ embeds: [errorEmbed], components: [] }).catch(()=>{});
    }
}

// --- Ahorcado Game ---
async function playAhorcado(interaction) {
     try {
        const palabras = [ 'javascript', 'programacion', 'discord', 'moonligth', 'videojuego', 'computadora', 'internet', 'desarrollo', 'tecnologia', 'algoritmo', 'aplicacion', 'servidor', 'cliente', 'interfaz', 'codigo'];
        const palabra = palabras[Math.floor(Math.random() * palabras.length)];
        let adivinadas = Array(palabra.length).fill('_');
        let intentosFallidos = 0;
        const maxIntentos = 6; // 6 wrong guesses = 7 states (0-6)
        const letrasUsadas = new Set();

        const estados = [
            '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```', // 0
            '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```', // 1
            '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```', // 2
            '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```', // 3
            '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```', // 4
            '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```', // 5
            '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```'  // 6 - Lost
        ];

        function updateEmbedDesc() {
            return `${estados[intentosFallidos]}\n\nPalabra: \`${adivinadas.join(' ')}\`\n\nLetras usadas: ${Array.from(letrasUsadas).join(', ') || 'Ninguna'}\nIntentos restantes: ${maxIntentos - intentosFallidos}`;
        }

        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('📝 Ahorcado')
            .setDescription(updateEmbedDesc());

        const botones = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('ahorcado-letra-btn').setLabel('Adivinar Letra').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('ahorcado-palabra-btn').setLabel('Adivinar Palabra').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('ahorcado-rendirse-btn').setLabel('Rendirse').setStyle(ButtonStyle.Danger)
            );

        let message;
         if (interaction.isButton() || interaction.isStringSelectMenu()) {
            message = await interaction.editReply({ embeds: [embed], components: [botones], fetchReply: true });
        } else {
            message = await interaction.reply({ embeds: [embed], components: [botones], fetchReply: true });
        }

        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, filter, time: 180000 }); // 3 minutes

        collector.on('collect', async i => {
            if (i.customId === 'ahorcado-rendirse-btn') {
                collector.stop('surrender');
                await i.deferUpdate();
                embed.setDescription(`${estados[maxIntentos]}\n\nTe has rendido.\nLa palabra era: **${palabra}**`);
                await showEndGameOptions(i, 'ahorcado', embed);
                return;
            }

            let modalCustomId;
            let modalTitle;
            let inputCustomId;
            let inputLabel;
            let inputPlaceholder;
            let minLength = 1;
            let maxLength = 1;

            if (i.customId === 'ahorcado-letra-btn') {
                 modalCustomId = `letra-modal-${i.id}`;
                 modalTitle = "Adivinar Letra";
                 inputCustomId = "letra-input";
                 inputLabel = "Escribe una letra";
                 inputPlaceholder = "Solo una letra";
                 minLength = 1;
                 maxLength = 1;
            } else if (i.customId === 'ahorcado-palabra-btn') {
                 modalCustomId = `palabra-modal-${i.id}`;
                 modalTitle = "Adivinar Palabra";
                 inputCustomId = "palabra-input";
                 inputLabel = "Escribe la palabra completa";
                 inputPlaceholder = "Tu respuesta";
                 minLength = palabra.length; // Can optionally set min/max length
                 maxLength = palabra.length;
            } else {
                return; // Should not happen
            }

            // --- Show Modal ---
            const modal = new ModalBuilder().setCustomId(modalCustomId).setTitle(modalTitle);
            const textInput = new TextInputBuilder()
                .setCustomId(inputCustomId)
                .setLabel(inputLabel)
                .setStyle(TextInputStyle.Short)
                .setMinLength(minLength)
                .setMaxLength(maxLength)
                .setPlaceholder(inputPlaceholder)
                .setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(textInput));
            await i.showModal(modal);

            // --- Await Modal ---
            const modalFilter = (modalInteraction) => modalInteraction.customId === modalCustomId && modalInteraction.user.id === i.user.id;
            try {
                 const modalResponse = await i.awaitModalSubmit({ filter: modalFilter, time: 60000 });
                 await modalResponse.deferUpdate();

                 const inputText = modalResponse.fields.getTextInputValue(inputCustomId).toLowerCase();

                 // --- Process Input ---
                 if (i.customId === 'ahorcado-letra-btn') {
                     const letra = inputText;
                     // Validation
                     if (!/^[a-z]$/.test(letra)) {
                         embed.setDescription(`${updateEmbedDesc()}\n\n*Entrada inválida. Debes ingresar una sola letra.*`);
                         await modalResponse.editReply({ embeds: [embed], components: [botones] });
                         return; // Don't penalize for invalid input type
                     }
                     if (letrasUsadas.has(letra)) {
                          embed.setDescription(`${updateEmbedDesc()}\n\n*Ya has usado la letra "${letra}".*`);
                          await modalResponse.editReply({ embeds: [embed], components: [botones] });
                          return; // Don't penalize for repeated guess
                     }

                     letrasUsadas.add(letra);
                     let acierto = false;
                     for (let j = 0; j < palabra.length; j++) {
                         if (palabra[j] === letra) {
                             adivinadas[j] = letra;
                             acierto = true;
                         }
                     }

                     if (!acierto) {
                         intentosFallidos++;
                     }
                 } else if (i.customId === 'ahorcado-palabra-btn') {
                     const palabraAdivinada = inputText;
                     if (palabraAdivinada === palabra) {
                        // Correct word guess - WIN
                         collector.stop('correctWord');
                         adivinadas = palabra.split(''); // Fill the word
                         embed.setDescription(`${estados[intentosFallidos]}\n\n¡Felicidades! Has adivinado la palabra: **${palabra}**`);
                         await showEndGameOptions(modalResponse, 'ahorcado', embed);
                         return;
                     } else {
                        // Incorrect word guess - LOSE
                         collector.stop('incorrectWord');
                         intentosFallidos = maxIntentos; // Player loses immediately
                         embed.setDescription(`${estados[intentosFallidos]}\n\nIncorrecto. La palabra era: **${palabra}**`);
                         await showEndGameOptions(modalResponse, 'ahorcado', embed);
                         return;
                     }
                 }

                 // --- Check Game State After Letter Guess ---
                 if (!adivinadas.includes('_')) {
                     // All letters guessed - WIN
                     collector.stop('allLettersGuessed');
                     embed.setDescription(`${estados[intentosFallidos]}\n\n¡Felicidades! Has adivinado la palabra: **${palabra}**`);
                     await showEndGameOptions(modalResponse, 'ahorcado', embed);
                 } else if (intentosFallidos >= maxIntentos) {
                     // No more attempts - LOSE
                     collector.stop('noMoreAttempts');
                     embed.setDescription(`${estados[maxIntentos]}\n\n¡Has perdido! La palabra era: **${palabra}**`);
                     await showEndGameOptions(modalResponse, 'ahorcado', embed);
                 } else {
                     // Game continues - update embed
                     embed.setDescription(updateEmbedDesc());
                     await modalResponse.editReply({ embeds: [embed], components: [botones] });
                      // collector.resetTimer(); // Optional: reset button timer
                 }

            } catch (err) {
                console.log("Hangman Modal timed out or failed:", err);
                if (!(err.code === 'InteractionCollectorError')) { // If not a standard timeout
                     collector.stop('modalError');
                     embed.setDescription(updateEmbedDesc() + '\n\n*Hubo un problema al procesar tu intento.*');
                     await interaction.editReply({ embeds: [embed], components:[]}).catch(()=>{}); // Edit original
                 }
            }
        });

        collector.on('end', (collected, reason) => {
             // Handle main button collector timeout only if game didn't end normally
            if (!['surrender', 'correctWord', 'incorrectWord', 'allLettersGuessed', 'noMoreAttempts', 'modalError'].includes(reason) && collected.size === 0) {
                 embed.setDescription(`${estados[intentosFallidos]}\n\n⏱️ Se acabó el tiempo para jugar.\nLa palabra era: **${palabra}**.`);
                 interaction.editReply({ embeds: [embed], components: [] }).catch(() => {});
            }
            console.log(`Ahorcado collector ended. Reason: ${reason || 'timeout'}. Collected: ${collected.size}`);
        });

     } catch (error) {
         console.error('Error al jugar al Ahorcado:', error);
         const errorEmbed = new EmbedBuilder().setColor('Red').setTitle('❌ Error').setDescription('Hubo un error al jugar al Ahorcado.');
          await interaction.editReply({ embeds: [errorEmbed], components: [] }).catch(()=>{});
     }
}


// --- Trivia Game ---
async function playTrivia(interaction) {
    try {
        const preguntas = [
            { pregunta: "¿Cuál es el planeta más grande del sistema solar?", opciones: ["Tierra", "Júpiter", "Saturno", "Marte"], respuesta: 1 },
            { pregunta: "¿Quién escribió 'Don Quijote de la Mancha'?", opciones: ["Federico García Lorca", "Miguel de Cervantes", "Gabriel García Márquez", "Pablo Neruda"], respuesta: 1 },
            { pregunta: "¿Cuál es el océano más grande del mundo?", opciones: ["Atlántico", "Índico", "Pacífico", "Ártico"], respuesta: 2 },
            { pregunta: "¿En qué año se descubrió América?", opciones: ["1492", "1592", "1392", "1500"], respuesta: 0 },
            { pregunta: "¿Cuál es el elemento químico con símbolo 'O'?", opciones: ["Oro", "Osmio", "Oxígeno", "Oganesón"], respuesta: 2 }
        ];
        const preguntaRandom = preguntas[Math.floor(Math.random() * preguntas.length)];

        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('❓ Trivia')
            .setDescription(`**Pregunta:** ${preguntaRandom.pregunta}\n\nSelecciona la respuesta correcta:`);

        const createTriviaButtons = (disabled = false, userSelection = null) => {
            return new ActionRowBuilder()
                .addComponents(
                    preguntaRandom.opciones.map((opcion, index) => {
                         let style = ButtonStyle.Primary;
                         if (disabled) {
                              if (index === preguntaRandom.respuesta) {
                                   style = ButtonStyle.Success; // Correct answer
                              } else if (index === userSelection) {
                                   style = ButtonStyle.Danger; // Incorrect user choice
                              } else {
                                   style = ButtonStyle.Secondary; // Other incorrect options
                              }
                         }
                         return new ButtonBuilder()
                            .setCustomId(`opcion-${index}`)
                            .setLabel(opcion)
                            .setStyle(style)
                            .setDisabled(disabled);
                    })
                );
        };

        const botones = createTriviaButtons(false); // Initially enabled buttons

        let message;
        if (interaction.isButton() || interaction.isStringSelectMenu()) {
            message = await interaction.editReply({ embeds: [embed], components: [botones], fetchReply: true });
        } else {
            message = await interaction.reply({ embeds: [embed], components: [botones], fetchReply: true });
        }

        const filter = i => i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, filter, time: 30000 }); // 30 seconds

        collector.on('collect', async i => {
            collector.stop('answered'); // Stop collector on answer
            await i.deferUpdate(); // Acknowledge

            const seleccion = parseInt(i.customId.split('-')[1]);
            const esCorrecto = seleccion === preguntaRandom.respuesta;

            let resultText = `**Pregunta:** ${preguntaRandom.pregunta}\n\n`;
            if (esCorrecto) {
                 resultText += `✅ ¡Correcto! La respuesta es: **${preguntaRandom.opciones[preguntaRandom.respuesta]}**`;
            } else {
                 resultText += `❌ Incorrecto. Tu respuesta: ${preguntaRandom.opciones[seleccion]}\nLa respuesta correcta es: **${preguntaRandom.opciones[preguntaRandom.respuesta]}**`;
            }
            embed.setDescription(resultText);

            // Show final state with disabled buttons indicating correctness
             const finalBotones = createTriviaButtons(true, seleccion);
             // We need to edit the reply using the button interaction 'i'
            await i.editReply({ embeds: [embed], components: [finalBotones] });

            // Now show the Play Again / Main Menu options AFTER showing the result
            // Pass the same interaction 'i' and the result embed
             await showEndGameOptions(i, 'trivia', embed); 
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'answered' && collected.size === 0) {
                 embed.setDescription(`**Pregunta:** ${preguntaRandom.pregunta}\n\n⏱️ Se acabó el tiempo. La respuesta correcta era: **${preguntaRandom.opciones[preguntaRandom.respuesta]}**`);
                 const finalBotones = createTriviaButtons(true, null); // Disable buttons, show correct answer
                 interaction.editReply({ embeds: [embed], components: [finalBotones] }).catch(() => {});
                 // No end game options on timeout
            }
            console.log(`Trivia collector ended. Reason: ${reason || 'timeout'}. Collected: ${collected.size}`);
        });

    } catch (error) {
        console.error('Error al jugar a Trivia:', error);
        const errorEmbed = new EmbedBuilder().setColor('Red').setTitle('❌ Error').setDescription('Hubo un error al jugar a Trivia.');
        await interaction.editReply({ embeds: [errorEmbed], components: [] }).catch(()=>{});
    }
}
