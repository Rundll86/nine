import { Empty, Normalize } from "@/util/types";
import { TreeContext, tree } from "./tree";
import { normalizePropertyDescriptor } from "./property";

export type RenderResult = {
    mount(to: string | HTMLElement): void;
    $: TreeContext;
} & { [K in typeof renderResultSymbol]: true; };
export type TreeResult = HTMLElement | TreeContext | string | number | Empty | RenderResult;
export interface ComponentRenderEntry<P extends ComponentPropertyStore> {
    (props: ComponentPropertyDict<P>, slot?: Empty | (() => TreeResult)): RenderResult;
}
export type Component<P extends Normalize<ComponentPropertyStore>> =
    ComponentRenderEntry<P> & NormalizedComponentOption<P>;
export interface ComponentPropertyDescriptor<I = unknown, O = unknown, R extends boolean = false> {
    validate?: (data: I) => boolean;
    transform: (data: I) => O;
    shadow?: O;
    required?: R;
}
export type ComponentPropertyStore = Record<string, ComponentPropertyDescriptor>;
export type ComponentPropertyDict<T extends ComponentPropertyStore> = {
    [K in keyof T]: T[K] extends ComponentPropertyDescriptor<unknown, infer R> ? R : never;
};
export interface ComponentOption<P extends ComponentPropertyStore> {
    props: P;
}
export interface NormalizedComponentOption<P extends ComponentPropertyStore> {
    props: Normalize<P>;
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
export function createComponent<
    P extends ComponentPropertyStore
>(
    options: ComponentOption<P>,
    renderer: (options: ComponentPropertyDict<P>, slot: () => TreeResult) => TreeResult
): Component<Normalize<P>> {
    const normalizedProps = Object.fromEntries(
        Object
            .entries(options.props)
            .map(([key, value]) => [
                key,
                normalizePropertyDescriptor(value),
            ])
    ) as Normalize<P>;
    return Object.assign((props: ComponentPropertyDict<Normalize<P>>, slot?: Empty | (() => TreeResult)) => {
        const nodeTree = renderer(props as ComponentPropertyDict<P>, () => slot?.());
        const result = normalizeTree(nodeTree);
        return {
            mount(to: string | HTMLElement) {
                const targets = typeof to === "string" ? [...document.querySelectorAll<HTMLElement>(to)] : [to];
                for (const target of targets) {
                    target.appendChild(result.element);
                }
            },
            $: result,
            [renderResultSymbol]: true as true
        };
    }, {
        props: normalizedProps
    } satisfies NormalizedComponentOption<P>);
}