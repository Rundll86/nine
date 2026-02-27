export function camelToHyphen<T extends string>(str: T): T {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`) as T;
}
export function hyphenToCamel<T extends string>(str: T): T {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as T;
}