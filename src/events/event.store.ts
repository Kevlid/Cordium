import { Event } from "./event.structure";

class EventStore extends Set<Event> {
    constructor() {
        super();
    }

    public get(name: string): Event | null {
        for (const event of this) {
            if (event.name === name) {
                return event;
            }
        }
        return null;
    }
}

export const eventStore = new EventStore();
