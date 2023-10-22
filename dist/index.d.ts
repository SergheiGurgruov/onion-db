import { Maybe, Result } from "onion-essentials";
type OnionDbDocument = Object & Record<string, any> & {
    id: string;
};
type OnionDbDocumentUpdate<T> = Omit<Partial<T>, "id">;
export declare function init(): void;
export declare function insertOne(collection: string, document: any, callback?: (result: Result<string, Error>) => void): Promise<Result<string, Error>>;
export declare function insertMany(collection: string, data: any[], callback?: (result: Result<string[], Error>) => void): Promise<Result<string[], Error>>;
export declare function find<T extends OnionDbDocument = any>(collection: string, query: Partial<T>, callback?: (result: Result<T[], Error>) => void): Promise<Result<T[], Error>>;
export declare function findById<T>(collection: string, id: string, callback?: (result: Result<Maybe<T>, Error>) => void): Promise<Result<Maybe<T>, Error>>;
export declare function findOne<T extends OnionDbDocument = any>(collection: string, query: Partial<T>, callback?: (result: Result<Maybe<T>, Error>) => void): Promise<Result<Maybe<T>, Error>>;
export declare function dropCollection(collection: string, callback?: (result: Result<void, Error>) => void): Promise<Result<void, Error>>;
export declare function updateOne<T extends OnionDbDocument = any>(collection: string, query: Partial<T>, update: OnionDbDocumentUpdate<T>, callback?: (result: Result<void, Error>) => void): Promise<Result<void, Error>>;
export declare function updateMany<T extends OnionDbDocument = any>(collection: string, query: Partial<T>, update: OnionDbDocumentUpdate<T>, callback?: (result: Result<void, Error>) => void): Promise<Result<void, Error>>;
export declare function deleteOne<T extends OnionDbDocument = any>(collection: string, query: Partial<T>, callback?: (result: Result<void, Error>) => void): Promise<Result<void, Error>>;
declare const _default: {
    init: typeof init;
    insertOne: typeof insertOne;
    insertMany: typeof insertMany;
    find: typeof find;
    findOne: typeof findOne;
    dropCollection: typeof dropCollection;
};
export default _default;
