# 🪲 Escarabajos Franco 🇫🇷 (Nexo Football Team)

Aplicación web Full-Stack desarrollada para la gestión integral de un equipo de fútbol amateur. Creada a partir del proyecto `11-builder` y completamente migrada a un framework moderno.

## 🚀 Tecnología
- **Framework Frontend & Backend**: [Next.js 15+](https://nextjs.org/) (App Router, Server Actions)
- **Base de Datos**: [SQLite](https://sqlite.org/) (usando `better-sqlite3`)
- **Estilos**: Vanilla CSS moderno con glassmorphism, degradados y *dark mode*.
- **Despliegue y Hosting**: Instancia Web Service en Render con disco montado.

## 👥 Roles y Flujos de Usuario

### 1. Administrador / Coach
- **Acceso:** Oculto mediante el parámetro secreto en la URL: `/?coach=secret-coach`
- **Funciones:**
  - **Plantilla:** Crear, gestionar y borrar la lista total de jugadores.
  - **Partido:** Programar el "Siguiente Partido" frente a un rival en una fecha determinada.
  - **Asistencia (RSVP):** Seguir el estado de confirmaciones en tiempo real de toda la plantilla.
  - **Cancha y Alineación:** Panel de gestión para mover jugadores confirmados desde la "Banca" hacia posiciones en la "Cancha".
  - **Recuperación:** Desvincular celulares (cookies) de los jugadores para que puedan volver a hacer *login* si pierden su teléfono.

### 2. Jugador
- **Acceso:** Vía dispositivo único vinculado (Cookie de 1 año sin contraseñas).
- **Funciones:**
  - Explorar la lista y pulsar en "Soy Yo" al lado de su nombre para vincular el celular.
  - Confirmar asistencia seleccionando si van a jugar o no. (Los que confirman que asisten, entran a la Banca del Coach listos para jugar).
  - Editar su Perfil: Renombrar su "Nombre" y "Apellido".

### 3. Visitante (Público general)
- **Acceso:** Enlace estándar de la aplicación.
- **Funciones:**
  - Visibilidad total en modo lectura. Pueden ver la fecha del siguiente encuentro, los jugadores y cómo dibujó la alineación el Coach en la cancha interactiva.

## 💾 Persistencia de Datos
El proyecto implementa un backend integrado que controla el archivo `database.sqlite` (lite-db nativa).
En entornos de producción serverless la base de datos es efímera, por lo cual se despliega en Render con un **Persistent Disk**.
Mediante la variable de entorno `DB_PATH=/data/database.sqlite`, el sistema sabe que debe modificar la información en el disco persistente que nunca se formatea para que ni el Coach ni los Jugadores pierdan los datos.

## 💻 Desarrollo Local (Dev Mode)

Para probar la app en tu propia computadora:
1. Instalar dependencias necesarias:
   ```bash
   npm install
   ```
2. Arrancar el servidor de Next.js:
   ```bash
   npm run dev
   ```
3. Dirigirse al dominio en el puerto 3000 con el token de administrador:
   [http://localhost:3000/?coach=secret-coach](http://localhost:3000/?coach=secret-coach)
