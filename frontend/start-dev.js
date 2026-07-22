import { createServer } from 'vite'

const server = await createServer({
  server: {
    middlewareMode: false,
  },
})

await server.listen()
console.log('Vite dev server is running!')
