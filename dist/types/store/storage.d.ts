export declare function readStorage(key: string, kind?: 'localStorage' | 'sessionStorage'): string | null;
export declare function writeStorage(key: string, value: string | null): void;
export declare function storageNamespace(): string;
