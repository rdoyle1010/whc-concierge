const fs = require('fs')
const path = require('path')

const appDir = path.join(__dirname, '..', 'app')
const sourceDirs = [appDir, path.join(__dirname, '..', 'src')]
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx'])

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

function routeForFile(file) {
  const rel = path.relative(appDir, file).replace(/\\/g, '/')
  if (!sourceExtensions.has(path.extname(rel))) return null
  let route = '/' + rel.replace(/\.(tsx?|jsx?)$/, '')
  route = route.replace(/\/index$/, '/')
  route = route.replace(/\/(?:\([^/]+\))\//g, '/')
  route = route.replace(/\/+/g, '/')
  return route.length > 1 && route.endsWith('/') ? route.slice(0, -1) : route
}

const routes = new Set(walk(appDir).map(routeForFile).filter(Boolean))

function routeExists(target) {
  if (target === '/') return routes.has('/')
  if (routes.has(target)) return true
  const targetParts = target.split('/').filter(Boolean)
  return [...routes].some(route => {
    const routeParts = route.split('/').filter(Boolean)
    if (routeParts.length !== targetParts.length) return false
    return routeParts.every((part, index) => /^\[[^\]]+\]$/.test(part) || part === targetParts[index])
  })
}

const patterns = [
  /router\.(?:push|replace)\(\s*['"`]([^'"`]+)['"`]/g,
  /pathname\s*:\s*['"`]([^'"`]+)['"`]/g,
  /href\s*:\s*['"`]([^'"`]+)['"`]/g,
]

const failures = []
for (const file of sourceDirs.flatMap(walk).filter(file => sourceExtensions.has(path.extname(file)))) {
  const text = fs.readFileSync(file, 'utf8')
  for (const pattern of patterns) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(text))) {
      const target = match[1]
      if (!target.startsWith('/') || target.startsWith('/api/')) continue
      if (target.includes('${') || target.includes('[')) {
        if (target.includes('[') && !routeExists(target)) failures.push({ file, target })
        continue
      }
      const clean = target.split('?')[0].split('#')[0]
      if (!routeExists(clean)) failures.push({ file, target: clean })
    }
  }
}

if (failures.length) {
  console.error('Mobile route audit failed. These navigation targets do not have a matching Expo route:')
  for (const failure of failures) console.error(`- ${path.relative(path.join(__dirname, '..'), failure.file)} -> ${failure.target}`)
  process.exit(1)
}

console.log(`Mobile route audit passed: ${routes.size} routes checked.`)
