export interface PluginOptions {
    name?: string;
    description?: string;
    eventPath?: string;
    commandPath?: string;
}

export interface PluginBuildOptions {
    directoryPath: string;
}
