import { Maybe, Result, none, some } from "onion-essentials";
import { existsSync, mkdirSync } from "fs";
import { readFile, readdir, writeFile } from "fs/promises";
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
    const json = Result.encase(() => JSON.stringify(data))
    if (json.isErr()) {
        console.error("non è stato possibile convertire in json l'oggetto: ", data, json.error.unwrap());
    }
    const collectionPath = path.join(DEFAULT_COLLECTIONS_FOLDER, collection);
    mkdirSyncTolerant(collectionPath);
    const documentID = uuid();
    data.id = documentID;
    const dataPath = path.join(collectionPath, documentID + ".json");
    console.log(dataPath);
    await writeFile(dataPath, json.unwrap());
}

export async function insertMany(collection: string, data: any[]) {
    const documents = Result.encase(() => data.map(document => {
        document.id = uuid();
        return {
            id: document.id,
            json: JSON.stringify(document)
        };
    }));
    if (documents.isErr()) {
        console.error("non è stato possibile convertire in json l'oggetto: ", data, documents.error.unwrap());
    }
    const collectionPath = path.join(DEFAULT_COLLECTIONS_FOLDER, collection);
    mkdirSyncTolerant(collectionPath);

    const writeFilesPromise: Promise<void>[] = [];
    for (const document of documents.unwrap()) {
        const dataPath = path.join(collectionPath, document.id + ".json");
        console.log(dataPath);
        writeFilesPromise.push(writeFile(dataPath, document.json));
    }

    await Promise.all(writeFilesPromise)
}

export async function find<T>(collection: string, query: any): Promise<T[]> {
    const collectionPath = path.join(DEFAULT_COLLECTIONS_FOLDER, collection);
    return await readdir(collectionPath)
        .then(filePaths => {
            const readFilesPromise: Promise<string>[] = []
            for (const filePath of filePaths) {
                readFilesPromise.push(readFile(path.join(collectionPath, filePath), { encoding: 'utf-8' }) as Promise<string>)
            }
            return Promise.all(readFilesPromise);
        })
        .then(files => files.map(file => JSON.parse(file)))
        .then(documents => documents.filter(document => {
            for (const key in query) {
                if (document[key] !== query[key]) {
                    return false;
                }
            }
            return true;
        }))
        .catch(error => {
            console.error("non è stato possibile eseguire la query: ", query, error);
            return [];
        })
}

export async function findOne<T>(collection: string, query: any): Promise<Maybe<T>> {
    return await find<T>(collection, query)
        .then(documents => documents[0] ? some(documents[0]) : none())
}

export default {
    init,
    insertOne,
    insertMany,
    find,
    findOne
}