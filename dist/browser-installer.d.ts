import { Browser } from 'playwright-core';
export declare class BrowserInstaller {
    static headless: boolean;
    /**
     * Launch a local browser using Playwright's default behavior or system Chromium
     */
    static launchLocalBrowser(): Promise<Browser>;
    /**
     * Find the best available browser executable on the system
     */
    private static findBrowserExecutable;
    /**
     * Get platform-specific browser search paths
     */
    private static getPlatformBrowserPaths;
    /**
     * Get platform-specific suggestions for fixing browser issues
     */
    private static getPlatformSpecificSuggestions;
    /**
     * Check if a file exists and is executable
     */
    private static isExecutableFile;
    static getChromiumLaunchArgs(headless?: boolean): string[];
}
