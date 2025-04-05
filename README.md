# 🌸 MoonLight | V1.1 🔥

[![Discord.js Version](https://img.shields.io/badge/discord.js-v14-blue.svg?logo=discord&logoColor=white)](https://discord.js.org/#/)
[![Node.js Version](https://img.shields.io/badge/node.js-v18+-green.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)  [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/YourUsername/MoonLight/graphs/commit-activity)
[![GitHub Issues](https://img.shields.io/github/issues/YourUsername/MoonLight.svg)](https://github.com/YourUsername/MoonLight/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/YourUsername/MoonLight.svg)](https://github.com/YourUsername/MoonLight/pulls)

¡Bienvenido al repositorio de **MoonLight**! ✨

Este es el hogar del código fuente de MoonLight, un bot de Discord multifuncional diseñado para enriquecer tu servidor.  

## ✨ Características Principales

*   **🎀 Sistema de Tickets Interactivo:**  Crea y gestiona tickets de soporte de forma fácil y organizada.  Totalmente personalizable.
*   **🛡️ Moderación:** Mantén el orden con comandos de moderación (ban, kick, mute, etc.).
*   **🥳 Minijuegos:**  ¡Divierte a tus miembros con minijuegos! (Detalles próximamente).
*   **🖼️ Imágenes y Avatares:**  Comandos para mostrar y manipular imágenes y avatares.
*   **⚙️ Utilidad:**  Herramientas útiles para la gestión del servidor.
*   **🚀 Constante Desarrollo:**  ¡Siempre estamos añadiendo nuevas funciones y mejoras!
*   **💖 Código Abierto:** ¡Contribuye al desarrollo de MoonLight!

## 📝 Comandos

Una lista completa de comandos está disponible usando el comando `/help` dentro del bot una vez añadido a tu servidor.

## ⚙️ Instalación

1.  **Requisitos Previos:**
    *   Node.js (v18 o superior)
    *   npm (Node Package Manager)
    *   Una cuenta de Discord y un token de bot ([Portal de Desarrolladores de Discord](https://discord.com/developers/applications))
    *   (Opcional) MongoDB (para funciones como las advertencias y el sistema de tickets)

2.  **Clonar el Repositorio:**

    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd <NOMBRE_DEL_REPOSITORIO>
    ```
     Reemplaza `<URL_DEL_REPOSITORIO>` con la URL de *tu* repositorio de GitHub, y `<NOMBRE_DEL_REPOSITORIO>` con el nombre del directorio.

3.  **Instalar Dependencias:**

    ```bash
    npm install
    ```

4.  **Configurar el Bot:**

    *   Crea un archivo `.env` en la raíz del proyecto.  **¡No subas este archivo a GitHub!**
    *   Añade las siguientes variables de entorno a `.env` (reemplaza los valores de ejemplo):

        ```
        DISCORD_TOKEN=TuTokenDeDiscordAqui
        DEVELOPER_ID=TuIDDeDiscordAqui
        DATABASE_URI=tu_uri_de_mongodb_aqui  # Solo si usas MongoDB
        ```

    *   Copia `config.js.example` (o `config.js` si ya lo tienes) y renómbralo a `config.js`.
    *   Edita `config.js` y configura las opciones:
        *   `bot.developerId`:  Tu ID de Discord.
        *   `links.invite`:  El enlace de invitación de *tu* bot (usa el generador de URLs de Discord).
        *   `logging.logServerId` y `logging.logChannelId`: IDs del servidor/canal de logs.
        *   `database.uri`: Si usas MongoDB.
        *   `images`: URLs de las imágenes.

5.  **Ejecutar el Bot:**

    ```bash
    node index.js  # O el nombre de tu archivo principal (ej: Yumi.js, bot.js, etc.)
    ```

## 🔗 Enlaces Útiles

*   **Servidor de Soporte:** [Servidor de Soporte de MoonLight](https://discord.gg/vZyQ3u5re2)
*   **Invitar a MoonLight:** [Enlace de Invitación](https://discord.com/api/oauth2/authorize?client_id=REPLACE_WITH_YOUR_BOT_ID&permissions=8&scope=bot%20applications.commands)  **<-- ¡REEMPLAZA `REPLACE_WITH_YOUR_BOT_ID` CON EL ID DE *TU* BOT!**  Y calcula los permisos correctos.
* **Términos de servicio:** [Términos](https://discord.com/terms)

## 🙌 Contribuciones

¡Las contribuciones son bienvenidas!  Si encuentras un error, tienes una sugerencia, o quieres añadir una nueva funcionalidad, por favor, abre un *issue* o envía un *pull request*.

## 💖 Agradecimientos

Gracias a todos los que han contribuido a este proyecto!

## 📝 Autor

*   **Ardiendo | \_.aari._**

## 📜 Licencia

Este proyecto está bajo la Licencia MIT.  Consulta el archivo `LICENSE` para más detalles.  (Asegúrate de crear un archivo `LICENSE` en tu repositorio con el texto de la Licencia MIT).
