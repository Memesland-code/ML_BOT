import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import pkg from "../package.json"

const packagePath = path.resolve(__dirname, "../package.json")

const versionRegex = /^(\d+)\.(\d+)\.(\d+)\-(\d+)(\.dev)?$/
const match = pkg.version.match(versionRegex)

if (!match)
{
    console.error(`❌ Invalid version format in package.json: ${pkg.version}`)
    process.exit(1)
}

const [, majorStr, minorStr, patchStr, revisionStr] = match
let major = parseInt(majorStr, 10)
let minor = parseInt(minorStr, 10)
let patch = parseInt(patchStr, 10)
let revision = parseInt(revisionStr, 10)

const bumpType = process.argv[2] || 'dev'
let newVersion = ''

switch (bumpType)
{
    case 'rev':
        revision += 1
        newVersion = `${major}.${minor}.${patch}-${revision}.dev`
        break

    case 'release':
        newVersion = `${major}.${minor}.${patch}-${revision}`
        break

    case 'patch':
        patch += 1
        revision += 1
        newVersion = `${major}.${minor}.${patch}-${revision}.dev`
        break

    case 'minor':
        minor += 1
        patch = 0
        revision += 1
        newVersion = `${major}.${minor}.${patch}-${revision}.dev`
        break

    case 'major':
        major += 1
        minor = 0
        patch = 0
        revision += 1
        newVersion = `${major}.${minor}.${patch}-${revision}.dev`
        break

    default:
        console.error('❌ Unknown bump type. Valid options: rev, patch, minor, major, release')
        process.exit(1)
}

const updatedPkg = { ...pkg, version: newVersion }
fs.writeFileSync(packagePath, JSON.stringify(updatedPkg, null, 2) + '\n')
console.log(`✅ Updated package.json version: ${pkg.version} ➔ ${newVersion}`)

try
{
    execSync('git add package.json package-lock.json', { stdio: "inherit" })
    execSync(`git commit -m "chore(version): update version to ${newVersion}"`, { stdio: 'inherit' })

    if (bumpType === 'release')
    {
        execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { stdio: 'inherit' })
        console.log(`🏷️ Created Git tag v${newVersion}`)
    }
} catch (error)
{
    console.error('⚠️ An error occurred during Git execution.')
}