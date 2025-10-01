import { Core } from "../core";
import { PrefixHandler } from "./prefix.handler";
import { SlashHandler } from "./slash.handler";

export class CommandManager {
    private core: Core;
    public prefixHandler: PrefixHandler;
    public slashHandler: SlashHandler;

    constructor(core: Core) {
        this.core = core;
        this.prefixHandler = new PrefixHandler(core);
        this.slashHandler = new SlashHandler(core);
    }
}
