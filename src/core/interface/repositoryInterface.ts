export interface BaseRepository<T> {
    fetchAll(...args: any[]): Promise<T[]>;
    fetchById(id: string, ...args: any[]): Promise<T | null>;
    write(data: T, ...args: any[]): Promise<T>;
    delete(id: string, ...args: any[]): Promise<void>;
}

export abstract class Repository<T> implements BaseRepository<T> {
    abstract fetchAll(...args: any[]): Promise<T[]>;
    abstract fetchById(...args: any[]): Promise<T | null>;
    abstract write(data: T, ...args: any[]): Promise<T>;
    abstract delete(...args: any[]): Promise<void>;
}
