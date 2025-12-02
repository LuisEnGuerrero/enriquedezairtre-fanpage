// Script para agregar canciones de ejemplo a la base de datos
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

const songs = [
  {
    title: "Noches de Sangre",
    artist: "Enrique de Zairtre",
    duration: 245,
    coverImage: "https://z-cdn-media.chatglm.cn/files/fe136bc7-0296-45b7-a567-82eb3e4072e4_Zairtre%20y%20Raltek.jpg?auth_key=1864304639-e6d63655667443888ad144ddaa27b31f-0-4b598a42d06e8256240c67561440c29f",
    audioUrl: "/audio/noches-de-sangre.mp3",
    lyrics: "En la oscuridad de la noche\nDonde las sombras danzan\nMi voz resuena con fuerza\nComo un trueno en la distancia..."
  },
  {
    title: "Dragón Dorado",
    artist: "Enrique de Zairtre",
    duration: 198,
    coverImage: "https://z-cdn-media.chatglm.cn/files/fe136bc7-0296-45b7-a567-82eb3e4072e4_Zairtre%20y%20Raltek.jpg?auth_key=1864304639-e6d63655667443888ad144ddaa27b31f-0-4b598a42d06e8256240c67561440c29f",
    audioUrl: "/audio/dragon-dorado.mp3",
    lyrics: "Alas de oro flamean\nEn el cielo oscuro\nFuego y magia ancestral\nLibertad en mi furor..."
  },
  {
    title: "Reino de las Sombras",
    artist: "Enrique de Zairtre",
    duration: 312,
    coverImage: "https://z-cdn-media.chatglm.cn/files/fe136bc7-0296-45b7-a567-82eb3e4072e4_Zairtre%20y%20Raltek.jpg?auth_key=1864304639-e6d63655667443888ad144ddaa27b31f-0-4b598a42d06e8256240c67561440c29f",
    audioUrl: "/audio/reino-sombras.mp3",
    lyrics: "En el reino donde la luz muere\nDonde el miedo nace y crece\nMi poder se hace infinito\nComo la eterna noche..."
  }
]

async function main() {
  console.log('🎵 Agregando canciones a la base de datos...')
  
  for (const song of songs) {
    await db.song.create({
      data: song
    })
    console.log(`✅ Canción agregada: ${song.title}`)
  }
  
  console.log('🎉 Todas las canciones han sido agregadas!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })