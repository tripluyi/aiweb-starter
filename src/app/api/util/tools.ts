import _ from 'lodash'
import fs from 'fs'
import path from 'path'

export const sleep = async (sec?: number): Promise<void> => {
    const secNumber = Number(sec) || 1
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, secNumber * 1000)
    })
}

export const findSpecificDir = async ({
    startPath,
    excludeDir,
    specificFile,
}: {
    specificFile: string
    startPath?: string
    excludeDir?: string
}): Promise<string> => {
    let currentPath = startPath || __dirname

    while (currentPath !== '/') {
        if (excludeDir && path.basename(currentPath) === excludeDir) {
            // Skip the "publish" folder and continue searching
            currentPath = path.dirname(currentPath)
            continue
        }

        const specificFilePath = path.join(currentPath, specificFile)
        try {
            await fs.promises.access(specificFilePath)
            return currentPath
        } catch (e) {
            // Ignore error and continue searching
        }

        currentPath = path.dirname(currentPath)
    }

    throw new Error(`Could not find specific folder starting from ${startPath}`)
}
