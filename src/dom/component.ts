import { EmptyValue } from "@/util/types";
import { HostTree, tree } from "./tree";
import { hostdown, normalizePropertyDescriptor, validateStore } from "./property";
import { Wrapper } from "./reactive";
import { SlotInput, SlotOutput, pipeExtract } from "./slot";
import { BrokenRendererError } from "@/exceptions";
import { appendFlag, COMPONENT_INSTANCE, HOST_TREE, matchFlag } from "@/constants/flags";

export interface ComponentRenderEntry<P extends ComponentPropertyStore> {
    (props?: ComponentPropertyInputDict<P>, slot?: SlotInput): ComponentInstance;
}
export type Component<P extends ComponentPropertyStore> =
    ComponentRenderEntry<P> & ComponentOption<P>;
export interface ComponentPropertyDescriptor<I = unknown, O = unknown, R extends boolean = boolean> {
    validate?: (data: I) => boolean;
    transform: (data: I) => O;
    shadow?: O;
    required?: R;
    downloadable?: boolean;
    uploadable?: boolean;
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
    ? Wrapper<R> : never;
};
export interface ComponentOption<P extends ComponentPropertyStore> {
    props?: P;
}
export type ComponentInstance = {
    mount(to: string | HTMLElement): void;
    $: HostTree;
};
export type SourceTree =
    HTMLElement |
    HostTree |
    string |
    number |
    boolean |
    EmptyValue |
    ComponentInstance;
export function render(nodeTree: SourceTree) {
    let result: HostTree;
    if (nodeTree instanceof HTMLElement) {
        result = tree(nodeTree);
    } else if (typeof nodeTree === "string" || typeof nodeTree === "number" || typeof nodeTree === "boolean") {
        result = tree(new Text(String(nodeTree)));
    } else if (matchFlag(nodeTree, COMPONENT_INSTANCE)) {
        result = nodeTree.$;
    } else if (nodeTree === null || nodeTree === undefined) {
        result = tree(new Comment("Empty tree context"));
    } else if (matchFlag(nodeTree, HOST_TREE)) {
        result = nodeTree;
    } else {
        throw new BrokenRendererError(`Failed to render ${nodeTree} into a Node.`);
    }
    return result;
}

export function $<T>(data: Wrapper<T>) {
    return data as unknown as Wrapper<SourceTree>;
}
export function createComponent<
    P extends ComponentPropertyStore
>(
    options: ComponentOption<P>,
    internalRenderer: (options: ComponentPropertyOutputDict<P>, slot: SlotOutput) => SourceTree
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
        const nodeTree = internalRenderer(hostdown(props, propStore), pipeExtract(slot));
        const result = render(nodeTree);
        return appendFlag({
            mount(to: string | HTMLElement) {
                const targets = typeof to === "string" ? [...document.querySelectorAll<HTMLElement>(to)] : [to];
                for (const target of targets) {
                    target.appendChild(result.element);
                }
            },
            $: result
        }, COMPONENT_INSTANCE);
    };
    return Object.assign(entryRenderer, {
        props: propStore
    } satisfies ComponentOption<P>);
}