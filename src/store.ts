export class StoreSet<T> extends Array<T> {
    constructor() {
        super();
    }

    public add(item: T): void {
        if (this.includes(item)) {
            throw new Error("Item already exists in the store");
        }
        this.push(item);
    }

    public get(predicate: (item: T) => boolean): T | null {
        for (const v of this) {
            if (predicate(v)) {
                return v;
            }
        }
        return null;
    }

    public remove(predicate: (item: T) => boolean): boolean {
        for (const v of this) {
            if (predicate(v)) {
                return this.delete(v);
            }
        }
        return false;
    }

    public delete(item: T): boolean {
        const index = this.indexOf(item);
        if (index > -1) {
            this.splice(index, 1);
            return true;
        }
        return false;
    }
}

export class StoreMap<K, V> extends Map<K, V> {
    constructor() {
        super();
    }
}
