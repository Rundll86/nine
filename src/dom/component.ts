import { EmptyValue } from "@/util/types";
import { HostTree, tree } from "./tree";
import { hostdown, normalizePropertyDescriptor, validateStore } from "./property";
import { Wrapper } from "./reactive";
import { SlotInput, SlotOutput, pipeExtract } from "./slot";
import { BrokenRendererError } from "@/exceptions";
import { attachFlag, COMPONENT_INSTANCE, HOST_TREE, matchFlag } from "@/constants/flags";
import { EventDescriptor } from "./event";
import { StyleSet } from "./style";
import { hyphenToCamel } from "@/util";

export interface ComponentRenderEntry<P extends ComponentPropertyStore, E extends ComponentEventStore> {
    (props?: ComponentPropertyInputDict<P>, slot?: SlotInput): ComponentInstance<E>;
}
export interface ComponentInternalRender<P extends ComponentPropertyStore, E extends ComponentEventStore> {
    (
        options: ComponentPropertyOutputDict<P>,
        slot: SlotOutput,
        emit: <D extends E[number], K extends D["name"]>(
            key: K,
            data: D extends infer R extends EventDescriptor<unknown, string> ? R["name"] extends K ? R["template"] : never : never
        ) => void
    ): SourceTree;
}
export type Component<P extends ComponentPropertyStore, E extends ComponentEventStore> =
    ComponentRenderEntry<P, E> & ComponentOption<P, E>;
export interface PropertyTransformer<I, O> {
    (data: I): O;
}
export interface ComponentPropertyDescriptor<I = unknown, O = unknown, R extends boolean = boolean> {
    validate?: (data: I) => boolean;
    transform: PropertyTransformer<I, O>;
    shadow?: O;
    required?: R;
    downloadable?: boolean;
    uploadable?: boolean;
}
export type ComponentEventStore = EventDescriptor<unknown, string>[];
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
export interface ComponentOption<P extends ComponentPropertyStore, E extends ComponentEventStore> {
    props?: P;
    events?: E;
    styles?: StyleSet[];
}
export type ComponentInstance<E extends ComponentEventStore = ComponentEventStore> = {
    mount(to: string | HTMLElement): void;
    on<D extends E[number], K extends D["name"]>(
        key: K,
        data: (data: D extends infer R extends EventDescriptor<unknown, string> ? R["name"] extends K ? R["template"] : never : never) => void
    ): ComponentInstance<E>;
    $: HostTree;
};
export type SourceTree = [
    HTMLElement,
    HostTree,
    string,
    number,
    boolean,
    EmptyValue,
    ComponentInstance,
][number];

export function render(nodeTree: SourceTree): HostTree {
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
export function createComponent<
    P extends ComponentPropertyStore,
    E extends EventDescriptor<unknown, string>
>(
    options: ComponentOption<P, E[]>,
    internalRenderer: ComponentInternalRender<P, E[]>
): Component<P, E[]> {
    validateStore(options.props ?? {});
    const propStore = Object.fromEntries(
        Object
            .entries(options.props ?? {})
            .map(([key, value]) => [
                key,
                normalizePropertyDescriptor(value),
            ])
    ) as P;
    const rawComponentUUID = crypto.randomUUID();
    const flagmentedUUID = flagment(rawComponentUUID);
    if (options.styles) {
        for (const styleSet of options.styles) {
            styleSet.apply(`[data-${flagmentedUUID}="true"]`);
        }
    }
    const entryRenderer = (props?: ComponentPropertyInputDict<P>, slot?: SlotInput) => {
        const nodeTree = internalRenderer(hostdown(props, propStore), pipeExtract(slot), (key, data) => {
            const targetEvent = options.events?.find(e => e.name === key);
            if (!targetEvent) throw new TypeError(`No events named ${key} to emit.`);
            hostTree.element.dispatchEvent(new CustomEvent(key, {
                detail: data,
                bubbles: targetEvent.bubbleable,
                cancelable: false
            }));
        });
        const hostTree = render(nodeTree);
        attachUUID(hostTree.element, rawComponentUUID);
        hostTree.hooks.update.subcribe((newTrees) => newTrees.forEach(tree => attachUUID(tree.element, rawComponentUUID)));
        return attachFlag({
            mount(to: string | HTMLElement) {
                const targets = typeof to === "string" ? [...document.querySelectorAll<HTMLElement>(to)] : [to];
                for (const target of targets) {
                    target.appendChild(hostTree.element);
                }
            },
            on(key: string, handler: (data: unknown) => void) {
                hostTree.on(key, event => event instanceof CustomEvent ? handler(event.detail) : null);
                return this;
            },
            $: hostTree
        }, COMPONENT_INSTANCE);
    };
    return Object.assign(entryRenderer, {
        props: propStore,
        events: options.events
    } as Component<P, E[]>);
}