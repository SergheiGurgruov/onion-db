import { none, some } from "onion-essentials";
import { insertOne, insertMany, findOne, find, dropCollection, deleteOne } from "./index.js";

test("callback insertOne-FindOne-DropCollection", async () => {
    await new Promise<void>((resolve, reject) => {
        insertOne('test', { name: 'test' }, (id) => {
            if (id.isErr()) {
                reject("Insertion failed");
                return;
            }
            findOne('test', { id: id.unwrap() }, (doc) => {
                if (doc.isErr()) {
                    reject("FindOne failed");
                    return;
                }
                expect(doc.unwrap()).toEqual(some({ name: 'test', id: id.unwrap() }))
                dropCollection('test', (result) => {
                    if (result.isErr()) {
                        reject("Drop Collection failed");
                        return;
                    }
                    resolve();
                })
            })
        })
    })

})

test("promise insertOne-FindOne-DropCollection", async () => {
    const id = await insertOne('test', { name: 'test' });
    if (id.isErr()) {
        throw "Insertion failed";
    }

    const doc = await findOne('test', { id: id.unwrap() })
    if (doc.isErr()) {
        throw "FindOne failed";
    }

    expect(doc.unwrap()).toEqual(some({ name: 'test', id: id.unwrap() }))
    const result = await dropCollection('test')
    if (result.isErr()) {
        throw "Drop Collection failed";
    }
})

test("callback findInEmptyCollection", async () => {
    await new Promise<void>((resolve, reject) => {
        find('test', { name: "test" }, (result) => {
            if (result.isErr()) {
                reject("Find failed")
            }
            expect(result.unwrap()).toEqual([])
            resolve();
        })
    })
})

test("promise findInEmptyCollection", async () => {
    const result = await find('test', { name: "test" })
    if (result.isErr()) {
        throw "Find failed"
    }
    expect(result.unwrap()).toEqual([])
})

test("callback insertMany-find-dropCollection", async () => {
    await new Promise<void>((resolve, reject) => {
        insertMany('test', [{ name: 'test' }, { name: 'test2' }], (ids) => {
            if (ids.isErr()) {
                reject("Insertion failed");
                return;
            }
            find('test', { name: "test" }, (result) => {
                if (result.isErr()) {
                    reject("Find failed")
                }
                expect(result.unwrap()).toEqual([{ name: 'test', id: ids.unwrap()[0] }])
                dropCollection('test', (result) => {
                    if (result.isErr()) {
                        reject("Drop Collection failed");
                        return;
                    }
                    resolve();
                })
            })
        })
    })
})

test("promise insertMany-findOne-dropCollection", async () => {
    const ids = await insertMany('test', [{ name: 'test', surname: "boh" }, { name: 'test2', surname: "boh" }])
    if (ids.isErr()) {
        throw "Insertion failed";
    }
    expect(ids.unwrap().length).toEqual(2);

    const result = await find('test', { surname: "boh" })
    if (result.isErr()) {
        throw "Find failed"
    }

    const docs = result.unwrap();
    expect(docs.length).toEqual(2);
    const docIDs = docs.mapInPlace((doc) => doc.id)
    expect(ids.unwrap()).toContain(docIDs[0]);
    expect(ids.unwrap()).toContain(docIDs[1]);

    const dropResult = await dropCollection('test')
    if (dropResult.isErr()) {
        throw "Drop Collection failed";
    }
})

test("deleteOne", async () => {
    const id = await insertOne('test', { name: 'test' });
    if (id.isErr()) {
        throw "Insertion failed";
    }

    const result = await deleteOne('test', { id: id.unwrap() })
    if (result.isErr()) {
        throw "Delete failed"
    }

    const doc = await findOne('test', { id: id.unwrap() })
    if (doc.isErr()) {
        throw "FindOne failed";
    }

    expect(doc.unwrap()).toEqual(none())
})

test("dropCollection", async () => {
    const result = await dropCollection('test')
    expect(result.isErr()).toBe(false)
})