import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";
import { v1 as uuid } from "uuid";

const DEFAULT_DB_FOLDER = path.join(process.cwd(), 'db');
const DEFAULT_INDEXES_FOLDER = path.join(DEFAULT_DB_FOLDER, 'indexes');
const DEFAULT_COLLECTIONS_FOLDER = path.join(DEFAULT_DB_FOLDER, 'collections');

function mkdirSyncTolerant(path: string) {
    if (!existsSync(path)) {
        mkdirSync(path);
    }
}

export function init() {
    mkdirSyncTolerant(DEFAULT_DB_FOLDER);
    mkdirSyncTolerant(DEFAULT_INDEXES_FOLDER);
    mkdirSyncTolerant(DEFAULT_COLLECTIONS_FOLDER);
}

export async function insertOne(collection: string, data: any) {
    const collectionPath = path.join(DEFAULT_COLLECTIONS_FOLDER, collection);
    mkdirSyncTolerant(collectionPath);
    const documentID = uuid();
    const dataPath = path.join(collectionPath, documentID + ".json");
    console.log(dataPath);
    await writeFile(dataPath, JSON.stringify(data));
}

export default {
    init,
    insertOne
}