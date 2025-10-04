export interface CordiumOptions {
    baseDirectory: string;
    prefix?: Array<string> | string;
    owners?: Array<string> | string;
    isPluginEnabled?: (pluginName: string, guildId: string) => boolean | Promise<boolean>;
}
