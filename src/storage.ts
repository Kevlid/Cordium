export class Store extends Map<string, any> {
    constructor() {
        super();
    }
}

export const storage = new Store();
