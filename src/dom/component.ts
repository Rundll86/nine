import { Empty } from "@/util/types";
import { TreeContext, tree } from "./tree";

export type RenderResult = {
    mount(to: string | HTMLElement): void;
    $: TreeContext;
} & { [K in typeof renderResultSymbol]: true; };
export type TreeResult = HTMLElement | TreeContext | string | number | Empty | RenderResult;
export interface Component<T> {
    (props: T, slot?: () => TreeResult): RenderResult;
}
export const renderResultSymbol = Symbol("RenderResultFlag");
export function isRenderResult(data: unknown): data is RenderResult {
    return !!data && Object.hasOwn(data, renderResultSymbol) && data[renderResultSymbol] === true;
}
export function normalizeTree(nodeTree: TreeResult) {
    let result: TreeContext;
    if (nodeTree instanceof HTMLElement) {
        result = tree(nodeTree);
    } else if (typeof nodeTree === "string" || typeof nodeTree === "number") {
        result = tree(new Text(String(nodeTree)));
    } else if (isRenderResult(nodeTree)) {
        result = nodeTree.$;
    } else if (!nodeTree) {
        result = tree(new Comment("Empty tree context"));
    } else {
        result = nodeTree;
    }
    return result;
}
export function createComponent<T = void>(renderer: (options: T, slot: () => TreeResult) => TreeResult): Component<T> {
    return (props: T, slot?: () => TreeResult) => {
        const nodeTree = renderer(props, () => slot?.());
        const result = normalizeTree(nodeTree);
        return {
            mount(to: string | HTMLElement) {
                const targets = typeof to === "string" ? [...document.querySelectorAll<HTMLElement>(to)] : [to];
                for (const target of targets) {
                    target.appendChild(result.element);
                }
            },
            $: result,
            [renderResultSymbol]: true
        };
    };
}