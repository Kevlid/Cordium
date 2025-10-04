export class StoreSet<T> extends Set<T> {
    constructor() {
        super();
    }

    public get(predicate: (item: T) => boolean): T | null {
        for (const v of this) {
            if (predicate(v)) {
                return v;
            }
        }
        return null;
    }
}

export class StoreMap<K, V> extends Map<K, V> {
    constructor() {
        super();
    }
}
