export async function sha256(bytes: Uint8Array) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes)))).map(x => x.toString(16).padStart(2, '0')).join(''); }
