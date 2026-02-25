import { EmptyValue } from "@/util/types";
import { TreeContext, tree } from "./tree";
import { composeDict, normalizePropertyDescriptor, validateStore } from "./property";
import { Wrapper } from "./reactive";
import { SlotInput, SlotOutput, pipeExtract } from "./slot";

export interface ComponentRenderEntry<P extends ComponentPropertyStore> {
    (props?: ComponentPropertyInputDict<P>, slot?: SlotInput): RenderResult;
}
export type Component<P extends ComponentPropertyStore> =
    ComponentRenderEntry<P> & ComponentOption<P>;
export interface ComponentPropertyDescriptor<I = unknown, O = unknown, R extends boolean = boolean> {
    validate?: (data: I) => boolean;
    transform: (data: I) => O;
    shadow?: O;
    required?: R;
}
export type ComponentPropertyStore = Record<string, ComponentPropertyDescriptor>;
export type ComponentPropertyInputDict<P extends ComponentPropertyStore> = {
    [K in keyof P as P[K]["required"] extends true ? K : never]:
    P[K] extends ComponentPropertyDescriptor<unknown, infer R>
    ? R | Wrapper<R> : never;
} & {
    [K in keyof P as P[K]["required"] extends false | unknown ? K : never]?:
    P[K] extends ComponentPropertyDescriptor<unknown, infer R>
    ? R | Wrapper<R> | EmptyValue : never;
}
export type ComponentPropertyOutputDict<P extends ComponentPropertyStore> = {
    [K in keyof P]:
    P[K] extends ComponentPropertyDescriptor<unknown, infer R>
    ? R : never;
};
export interface ComponentOption<P extends ComponentPropertyStore> {
    props?: P;
}
export type RenderResult = {
    mount(to: string | HTMLElement): void;
    $: TreeContext;
} & { [K in typeof renderResultSymbol]: true; };
export type TreeResult =
    HTMLElement |
    TreeContext |
    string |
    number |
    EmptyValue |
    RenderResult;
export function render(nodeTree: TreeResult) {
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
export const renderResultSymbol = Symbol("RenderResultFlag");
export function isRenderResult(data: unknown): data is RenderResult {
    return !!data && Object.hasOwn(data, renderResultSymbol) && data[renderResultSymbol] === true;
}
export function $<T>(data: Wrapper<T>) {
    return data as unknown as Wrapper<TreeResult>;
}
export function createComponent<
    P extends ComponentPropertyStore
>(
    options: ComponentOption<P>,
    internalRenderer: (options: ComponentPropertyOutputDict<P>, slot: SlotOutput) => TreeResult
): Component<P> {
    validateStore(options.props ?? {});
    const propStore = Object.fromEntries(
        Object
            .entries(options.props ?? {})
            .map(([key, value]) => [
                key,
                normalizePropertyDescriptor(value),
            ])
    ) as P;
    const entryRenderer = (props?: ComponentPropertyInputDict<P>, slot?: SlotInput) => {
        const nodeTree = internalRenderer(composeDict(props, propStore), pipeExtract(slot));
        const result = render(nodeTree);
        return {
            mount(to: string | HTMLElement) {
                const targets = typeof to === "string" ? [...document.querySelectorAll<HTMLElement>(to)] : [to];
                for (const target of targets) {
                    target.appendChild(result.element);
                }
            },
            $: result,
            [renderResultSymbol]: true as const
        };
    };
    return Object.assign(entryRenderer, {
        props: propStore
    } satisfies ComponentOption<P>);
}