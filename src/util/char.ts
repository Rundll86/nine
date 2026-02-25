export function camelToHyphen(str: string) {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}
export function hyphenToCamel(str: string) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}