import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const phpFromXampp = 'C:\\xampp\\php\\php.exe'
const phpExecutable = process.env.PHP_BINARY_PATH || (existsSync(phpFromXampp) ? phpFromXampp : 'php')
const apiUrl = 'http://127.0.0.1:8000/api/auth/me.php'
const children = []
let shuttingDown = false

function stopChildren() {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (child.exitCode === null) child.kill()
  }
}

process.once('SIGINT', () => {
  process.exitCode = 130
  stopChildren()
})
process.once('SIGTERM', () => {
  process.exitCode = 143
  stopChildren()
})

function startProcess(executable, args, label) {
  const child = spawn(executable, args, { cwd: projectRoot, stdio: 'inherit' })
  children.push(child)
  child.on('error', (error) => {
    child.spawnError = error
    console.error(`${label} could not start: ${error.message}`)
    process.exitCode = 1
    stopChildren()
  })
  return child
}

async function probeApi() {
  try {
    const response = await fetch(apiUrl)
    return { status: response.status, body: await response.text() }
  } catch {
    return null
  }
}

async function waitForApi(child) {
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    if (child.spawnError) {
      throw new Error(`PHP could not start: ${child.spawnError.message}`)
    }
    if (child.exitCode !== null) {
      throw new Error('The PHP API server stopped before it became ready.')
    }
    const response = await probeApi()
    if (response) {
      if (response.status === 401) return
      throw new Error(`The PHP API returned HTTP ${response.status}: ${response.body}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('The PHP API did not become ready. Check that PHP is installed and port 8000 is available.')
}

async function main() {
  const existingApi = await probeApi()
  if (existingApi && existingApi.status !== 401) {
    throw new Error(`The PHP API returned HTTP ${existingApi.status}: ${existingApi.body}`)
  }

  let phpServer
  if (!existingApi) {
    phpServer = startProcess(phpExecutable, ['-S', '127.0.0.1:8000', '-t', projectRoot], 'PHP API')
    await waitForApi(phpServer)
    phpServer.on('exit', (code) => {
      if (shuttingDown) return
      console.error(`The PHP API server exited with code ${code ?? 'unknown'}.`)
      process.exitCode = 1
      stopChildren()
    })
  }

  const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!existsSync(viteCli)) {
    throw new Error('Vite is not installed. Run npm.cmd install before starting the app.')
  }
  const viteServer = startProcess(process.execPath, [viteCli], 'Vite')
  await new Promise((resolve, reject) => {
    viteServer.once('error', reject)
    viteServer.once('exit', (code) => {
      if (code !== 0 && code !== null) process.exitCode = code
      resolve()
    })
  })
}

main()
  .catch((error) => {
    console.error(`Unable to start the library app: ${error.message}`)
    process.exitCode = 1
  })
  .finally(stopChildren)
