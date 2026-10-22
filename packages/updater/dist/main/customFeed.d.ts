import { UpdateInfo } from '../types';
export declare function fetchCustomFeed(feedUrl: string, platform?: NodeJS.Platform): Promise<{
    info: UpdateInfo;
    downloadUrl: string;
    assetName: string;
}>;
