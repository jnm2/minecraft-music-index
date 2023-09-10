export default class Utils {
    static #byteFormatSuffixes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    static formatBytes(byteCount: number) {
        for (var suffixIndex = 0; suffixIndex < this.#byteFormatSuffixes.length; suffixIndex++) {
            const nextByteCount = byteCount / 1024;
            if (nextByteCount < 1) break;
            byteCount = nextByteCount;
        }

        return `${byteCount.toPrecision(3)} ${this.#byteFormatSuffixes[suffixIndex]}`;
    }
}
