export function flagment<T extends string>(uuid: T) {
    return `nine_${uuid.replaceAll("-", "_")}` as const;
}
export function attachUUID(root: Node, uuid: string): Node {
    for (const node of [root, ...root.childNodes]) {
        if (node instanceof HTMLElement) {
            node.dataset[flagment(uuid)] = "true";
        }
        if (node !== root && node.childNodes.length > 0) {
            attachUUID(node, uuid);
        }
    }
    return root;
}