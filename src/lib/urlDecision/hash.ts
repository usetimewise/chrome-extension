const SHA256_HEX_LENGTH = 64;

export async function sha256Hex(input: string): Promise<string> {
    const bytes = new TextEncoder().encode(input);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

export function splitHashPrefixSuffix(
    hashHex: string,
    prefixBits: number,
): { prefix: string; suffix: string } {
    if (prefixBits <= 0 || prefixBits % 4 !== 0) {
        throw new Error("prefixBits must be positive and divisible by 4");
    }
    if (!/^[0-9a-f]+$/.test(hashHex) || hashHex.length !== SHA256_HEX_LENGTH) {
        throw new Error("hashHex must be a lowercase SHA-256 hex digest");
    }

    const prefixLength = prefixBits / 4;
    return {
        prefix: hashHex.slice(0, prefixLength),
        suffix: hashHex.slice(prefixLength),
    };
}
