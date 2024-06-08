import http from 'node:http'

import { indexHtml, mainCss, user, exportUser, importUser } from './controllers.js'
import { PORT } from './config.js'

const server = http.createServer(async (request, response) => {
  const url = request.url
  const method = request.method

  if (method === 'GET') {
    switch (url) {
      case '/':
        indexHtml(request, response)

        break

      case '/public/main.css':
        mainCss(request, response)

        break

      case '/api/usuarios':

        user(request, response)

        break

      case '/api/usuarios/export':

        exportUser(request, response)

        break
      case '/api/usuarios/import':
        importUser(request, response)

        break

      default:
        response.writeHead(200, { 'Content-type': 'text/plain; charset=utf-8' })
        response.end('La página no existe')
        break
    }
  }
})

server.listen((PORT), () => console.log('servidor levantado!'))
