import fs from 'fs/promises'
import { pool } from './db.js'

export const indexHtml = async (req, res) => {
  res.writeHead(200, { 'Content-type': 'text/html; charset=utf-8' })
  const body = await fs.readFile('./public/principal.html', 'utf-8')
  res.end(body)
}

export const mainCss = async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/css' })
  const css = await fs.readFile('./public/main.css')
  res.end(css)
}

export const user = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM usuarios')
    const usuarios = resultado[0]

    const formattedData = usuarios.map(user => {
      const fechaCreacion = user.fecha_creacion.toISOString().slice(0, 10)
      return {
        id: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        direccion: user.direccion,
        correo_electronico: user.correo_electronico,
        dni: user.dni,
        edad: user.edad,
        fecha_creacion: fechaCreacion,
        telefono: user.telefono,
        contrasena: user.contrasena
      }
    })
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(formattedData))
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    console.log(error)
    res.end(JSON.stringify({ message: 'Error interno' }))
  }
}

export const exportUser = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM usuarios')
    const usuarios = resultado[0]

    const headers = Object.keys(usuarios[0]).join(',')

    const filas = usuarios.reduce((acc, usuario) => {
      const fechaCreacion = usuario.fecha_creacion.toISOString().slice(0, 10)
      const string = `\n ${usuario.id_usuario},${usuario.nombre},${usuario.apellido},${usuario.direccion},${usuario.correo_electronico},${usuario.dni},${usuario.edad},${fechaCreacion},${usuario.telefono},${usuario.contrasena}`
      return acc + string
    }, '')

    const content = headers + filas

    await fs.writeFile('usuarios.csv', content)

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Datos exportados a usuarios.csv' }))
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    console.log(error)
    res.end(JSON.stringify({ message: 'Error interno' }))
  }
}

export const importUser = async (req, res) => {
  const correoValido = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(correo)
  }
  try {
    const content = await fs.readFile('usuarios.csv', 'utf-8')
    const filas = content.split('\n')

    filas.shift()

    const mensajes = []

    for (const fila of filas) {
      const valores = fila.split(',')

      const id = valores[0]
      const nombre = valores[1]
      const apellido = valores[2]
      const direccion = valores[3]
      const correoElectronico = valores[4]
      const dni = valores[5]
      const edad = valores[6]
      const fechaCreacion = valores[7]
      const telefono = valores[8]
      const contrasena = valores[9]

      if (!correoValido(correoElectronico)) {
        const mensajeError = `Correo electrónico no válido para la fila con ID número: ${id}.`
        console.log(mensajeError)
        mensajes.push(mensajeError)
        continue
      }

      try {
        await pool.execute('INSERT INTO usuarios(nombre,apellido,direccion,correo_electronico,dni,edad,fecha_creacion, telefono, contrasena) VALUES (?,?,?,?,?,?,?,?,?)', [nombre, apellido, direccion, correoElectronico, dni, edad, fechaCreacion, telefono, contrasena])
        console.log('Se insertaron los usuarios', nombre)
        mensajes.push(`Se insertó el usuario: ${nombre}`)
      } catch (error) {
        if (error.errno === 1062) {
          const mensajeError = `No se insertó la fila con el ID número: ${id} debido a datos duplicados.`
          console.log(mensajeError)
          mensajes.push(mensajeError)
          continue
        }
        res.writeHead(500, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ message: 'Error al subir datos' }))
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Datos importados con exito!', detalles: mensajes }))
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Archivo.csv no encontrado')
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: 'Archivo usuario.csv no encontrado.' }))
    } else {
      console.error('Error al leer el archivo CSV')
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: 'Error interno al leer el archivo usuarios.csv' }))
    }
  }
}
