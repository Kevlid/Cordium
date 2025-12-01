export interface PluginOptions {
    name?: string;
    description?: string;
    eventPath?: string;
    commandPath?: string;
    pagerPath?: string;
    taskPath?: string;
}

export interface PluginBuildOptions {
    directoryPath: string;
}
