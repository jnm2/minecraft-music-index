export default class Downloader {
    static async fetchVersionManifest() {
        return await (await fetch('https://piston-meta.mojang.com/mc/game/version_manifest.json')).json() as {
            latest: {
                release: string,
                snapshot: string,
            },
            versions: {
                id: string,
                type: string,
                url: string,
                time: string,
                releaseTime: string,
            }[],
        };
    }

    static async *fetchAssetIndexUrls() {
        const versionManifest = await this.fetchVersionManifest();

        const releases = versionManifest.versions
            .filter((version, index) => index === 0 || version.type === 'release')
            .reverse();

        const assetHashes = new Set<string>();

        for (const release of releases) {
            const assetIndex = (await (await fetch(release.url)).json()).assetIndex as {
                id: string,
                sha1: string,
                size: number,
                totalSize: number,
                url: string,
            };

            if (!assetHashes.has(assetIndex.sha1)) {
                assetHashes.add(assetIndex.sha1);
                yield {
                    url: assetIndex.url,
                    firstVersion: { id: release.id, releaseTime: release.releaseTime },
                };
            }
        }
    }

    static async fetchAssetIndex(url: string) {
        return (await (await fetch(url)).json()) as {
            objects: {
                [id: string]: { hash: string, size: number },
            },
        };
    }

    static buildAssetUrl(assetHash: string) {
        return `https://resources.download.minecraft.net/${assetHash.substring(0, 2)}/${assetHash}`;
    }
}
