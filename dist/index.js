import { Result, none, once, parallel, some, } from "onion-essentials";
import { existsSync, mkdirSync, rm } from "fs";
import { readFile, readdir, writeFile } from "fs";
import path from "path";
import { v1 as uuid } from "uuid";
const DEFAULT_DB_FOLDER = path.join(process.cwd(), 'db');
const DEFAULT_INDEXES_FOLDER = path.join(DEFAULT_DB_FOLDER, 'indexes');
const DEFAULT_COLLECTIONS_FOLDER = path.join(DEFAULT_DB_FOLDER, 'collections');
function mkdirSyncTolerant(path) {
    if (!existsSync(path)) {
        mkdirSync(path);
    }
}
export function init() {
    mkdirSyncTolerant(DEFAULT_DB_FOLDER);
    mkdirSyncTolerant(DEFAULT_INDEXES_FOLDER);
    mkdirSyncTolerant(DEFAULT_COLLECTIONS_FOLDER);
}
export function insertOne(collection, document, callback) {
    if (!callback) {
        return new Promise((resolve) => {
            insertOne(collection, document, resolve);
        });
    }
    const resolve = once(callback);
    document.id = uuid();
    const collectionPath = path.join(DEFAULT_COLLECTIONS_FOLDER, collection);
    const dataPath = path.join(collectionPath, document.id + ".json");
    mkdirSyncTolerant(collectionPath);
    const json = Result.encase(() => JSON.stringify(document));
    json.match((error) => { resolve(Result.Err(error)); }, (value) => {
        writeFile(dataPath, value, (error) => {
            if (error) {
                resolve(Result.Err(error));
                return;
            }
            resolve(Result.Ok(document.id));
        });
    });
}
export function insertMany(collection, data, callback) {
    if (!callback) {
        return new Promise((resolve) => {
            insertMany(collection, data, resolve);
        });
    }
    const resolve = once(callback);
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
    parallel(($await, $) => {
        for (const document of documents.unwrap()) {
            const dataPath = path.join(collectionPath, document.id + ".json");
            $await(writeFile(dataPath, document.json, error => {
                if (error) {
                    resolve(Result.Err(error));
                    return $(undefined);
                }
                $(document.id);
            }));
        }
    }, (response) => {
        resolve(Result.Ok(response));
    });
}
export function find(collection, query, callback) {
    if (!callback) {
        return new Promise((resolve) => {
            find(collection, query, resolve);
        });
    }
    const resolve = once(callback);
    const collectionPath = path.join(DEFAULT_COLLECTIONS_FOLDER, collection);
    if (query.hasOwnProperty("id")) {
        findById(collection, query.id, (result) => {
            result.match((error) => { resolve(Result.Err(error)); }, (document) => {
                if (document.isNone()) {
                    resolve(Result.Ok([]));
                    return;
                }
                resolve(Result.Ok([document.unwrap()]));
            });
        });
        return;
    }
    console.log("collectionPath", collectionPath);
    if (!existsSync(collectionPath)) {
        resolve(Result.Ok([]));
        return;
    }
    readdir(collectionPath, (error, filePaths) => {
        console.log("filePaths", filePaths);
        console.log("error", error);
        if (error) {
            resolve(Result.Err(error));
            return;
        }
        parallel(($await, $resolve) => {
            for (const filePath of filePaths) {
                $await(readFile(path.join(collectionPath, filePath), { encoding: 'utf-8' }, (error, file) => {
                    if (error) {
                        resolve(Result.Err(error));
                        return $resolve(undefined);
                    }
                    $resolve(file);
                }));
            }
        }, (files) => {
            const queryOutput = files.mapInPlace(file => JSON.parse(file)).filterInPlace(document => {
                for (const key in query) {
                    if (document[key] !== query[key]) {
                        return false;
                    }
                }
                return true;
            });
            resolve(Result.Ok(queryOutput));
        });
    });
}
export function findById(collection, id, callback) {
    if (!callback) {
        return new Promise((resolve) => {
            findById(collection, id, resolve);
        });
    }
    const resolve = once(callback);
    const collectionPath = path.join(DEFAULT_COLLECTIONS_FOLDER, collection);
    const documentPath = path.join(collectionPath, id + ".json");
    if (!existsSync(documentPath)) {
        resolve(Result.Ok(none()));
        return;
    }
    readFile(documentPath, { encoding: 'utf-8' }, (error, file) => {
        if (error) {
            resolve(Result.Err(error));
            return;
        }
        resolve(Result.Ok(some(JSON.parse(file))));
    });
}
export function findOne(collection, query, callback) {
    if (!callback) {
        return new Promise((resolve) => {
            findOne(collection, query, resolve);
        });
    }
    const resolve = once(callback);
    find(collection, query, (result) => {
        result.match((error) => { resolve(Result.Err(error)); }, (documents) => {
            if (documents.length === 0) {
                resolve(Result.Ok(none()));
                return;
            }
            resolve(Result.Ok(some(documents[0])));
        });
    });
}
export function dropCollection(collection, callback) {
    if (!callback) {
        return new Promise((resolve) => {
            dropCollection(collection, resolve);
        });
    }
    const resolve = once(callback);
    const collectionPath = path.join(DEFAULT_COLLECTIONS_FOLDER, collection);
    if (!existsSync(collectionPath)) {
        resolve(Result.Ok());
        return;
    }
    rm(collectionPath, { recursive: true }, (error) => {
        if (error) {
            resolve(Result.Err(error));
            return;
        }
        resolve(Result.Ok());
    });
}
export function updateOne(collection, query, update, callback) {
    if (!callback) {
        return new Promise((resolve) => {
            updateOne(collection, query, update, resolve);
        });
    }
    const resolve = once(callback);
    findOne(collection, query, (result) => {
        result.match((error) => { resolve(Result.Err(error)); }, (result) => {
            if (result.isNone()) {
                resolve(Result.Ok());
                return;
            }
            const document = result.unwrap();
            Object.assign(document, update);
            const collectionPath = path.join(DEFAULT_COLLECTIONS_FOLDER, collection);
            const dataPath = path.join(collectionPath, document.id + ".json");
            const json = Result.encase(() => JSON.stringify(result));
            json.match((error) => { resolve(Result.Err(error)); }, (value) => {
                writeFile(dataPath, value, (error) => {
                    if (error) {
                        resolve(Result.Err(error));
                        return;
                    }
                    resolve(Result.Ok());
                });
            });
        });
    });
}
export function updateMany(collection, query, update, callback) {
    if (!callback) {
        return new Promise((resolve, reject) => {
            updateMany(collection, query, update, resolve);
        });
    }
    const resolve = once(callback);
    find(collection, query, (result) => {
        result.match((error) => { resolve(Result.Err(error)); }, (documents) => {
            if (documents.length === 0) {
                resolve(Result.Ok());
                return;
            }
            const collectionPath = path.join(DEFAULT_COLLECTIONS_FOLDER, collection);
            parallel(($await, $resolve) => {
                documents.mapInPlace(document => Object.assign(document, update)).mapInPlace(updatedDocument => {
                    const json = Result.encase(() => JSON.stringify(updatedDocument));
                    json.match((error) => { resolve(Result.Err(error)); }, (value) => {
                        const documentPath = path.join(collectionPath, updatedDocument.id + ".json");
                        $await(writeFile(documentPath, value, (error) => {
                            if (error) {
                                resolve(Result.Err(error));
                                return $resolve(undefined);
                            }
                            $resolve(undefined);
                        }));
                    });
                });
            }, (_) => {
                resolve(Result.Ok());
            });
        });
    });
}
export function deleteOne(collection, query, callback) {
    if (!callback) {
        return new Promise((resolve, reject) => {
            deleteOne(collection, query, resolve);
        });
    }
    const resolve = once(callback);
    findOne(collection, query, (result) => {
        result.match((error) => { resolve(Result.Err(error)); }, (maybeDoc) => {
            maybeDoc.match(() => {
                resolve(Result.Ok());
                return;
            }, (document) => {
                const collectionPath = path.join(DEFAULT_COLLECTIONS_FOLDER, collection);
                const dataPath = path.join(collectionPath, document.id + ".json");
                rm(dataPath, (error) => {
                    if (error) {
                        resolve(Result.Err(error));
                        return;
                    }
                    resolve(Result.Ok());
                });
            });
        });
    });
}
export default {
    init,
    insertOne,
    insertMany,
    find,
    findOne,
    dropCollection
};
