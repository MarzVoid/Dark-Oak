import { UpdateInfo } from '../types';
export interface GitHubReleaseAsset {
    name: string;
    browser_download_url: string;
    size: number;
}
export interface GitHubReleaseResponse {
    tag_name: string;
    name: string;
    body: string;
    html_url: string;
    published_at?: string;
    assets: GitHubReleaseAsset[];
}
export declare function pickAssetForPlatform(assets: GitHubReleaseAsset[], platform?: NodeJS.Platform): GitHubReleaseAsset | null;
export declare function fetchGitHubRelease(repo: string, token?: string, platform?: NodeJS.Platform): Promise<{
    info: UpdateInfo;
    downloadUrl: string;
    assetName: string;
}>;
