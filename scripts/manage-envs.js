import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const IMG_DIR = path.join(ROOT, 'img')
const PUBLIC_DIR = path.join(ROOT, 'public')
const PUBLIC_IMG = path.join(PUBLIC_DIR, 'img')
const MANIFESTS_DIR = path.join(PUBLIC_DIR, 'manifests')
const ENVS_FILE = path.join(PUBLIC_DIR, 'environments.json')

function ensureDir(d) { fs.mkdirSync(d, { recursive: true }) }
function rmrf(p) {
  if (!fs.existsSync(p)) return
  const stat = fs.statSync(p)
  if (stat.isDirectory()) {
    for (const f of fs.readdirSync(p)) rmrf(path.join(p, f))
    fs.rmdirSync(p)
  } else fs.unlinkSync(p)
}

function readEnvs() {
  if (!fs.existsSync(ENVS_FILE)) return []
  try { return JSON.parse(fs.readFileSync(ENVS_FILE, 'utf-8')) || [] } catch { return [] }
}
function writeEnvs(list) { ensureDir(PUBLIC_DIR); fs.writeFileSync(ENVS_FILE, JSON.stringify(list, null, 2), 'utf-8') }

function syncList() {
  if (!fs.existsSync(IMG_DIR)) writeEnvs([])
  const envs = fs.readdirSync(IMG_DIR).filter(d => fs.statSync(path.join(IMG_DIR, d)).isDirectory())
  writeEnvs(envs)
  console.log('Ambientes atualizados:', envs.join(', '))
}

function delEnv(env) {
  rmrf(path.join(PUBLIC_IMG, env))
  rmrf(path.join(MANIFESTS_DIR, `${env}.json`))
  const list = readEnvs().filter(e => e !== env)
  writeEnvs(list)
  console.log('Ambiente removido:', env)
}

const cmd = process.argv[2] || 'sync'
if (cmd === 'delete') {
  const env = process.argv[3]
  if (!env) { console.error('Uso: node scripts/manage-envs.js delete <env>'); process.exit(1) }
  delEnv(env)
} else {
  syncList()
}