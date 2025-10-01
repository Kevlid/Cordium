import { Core } from "../core";
import { PrefixHandler } from "./prefix.handler";

export class CommandManager {
    private core: Core;
    public prefixHandler: PrefixHandler;

    constructor(core: Core) {
        this.core = core;
        this.prefixHandler = new PrefixHandler(core);
    }

    /* One function to load it all based on type */
}
