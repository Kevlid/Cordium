import type { Core } from "./core";

export class Container {
    public core!: Core;
}

export const container = new Container();
