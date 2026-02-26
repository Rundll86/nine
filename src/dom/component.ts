import { EmptyValue } from "@/util/types";
import { HostTree, tree } from "./tree";
import { hostdown, normalizePropertyDescriptor, validateStore } from "./property";
import { Wrapper } from "./reactive";
import { SlotInput, SlotOutput, pipeExtract } from "./slot";
import { BrokenRendererError } from "@/exceptions";
import { appendFlag, COMPONENT_INSTANCE, HOST_TREE, matchFlag } from "@/constants/flags";
import { EventDescriptor } from "./event";

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
    const entryRenderer = (props?: ComponentPropertyInputDict<P>, slot?: SlotInput) => {
        const nodeTree = internalRenderer(hostdown(props, propStore), pipeExtract(slot), (key, data) => {
            const targetEvent = options.events?.find(e => e.name === key);
            if (!targetEvent) throw new TypeError(`No events named ${key} to emit.`);
            result.element.dispatchEvent(new CustomEvent(key, {
                detail: data,
                bubbles: targetEvent.bubbleable,
                cancelable: false
            }));
        });
        const result = render(nodeTree);
        return appendFlag({
            mount(to: string | HTMLElement) {
                const targets = typeof to === "string" ? [...document.querySelectorAll<HTMLElement>(to)] : [to];
                for (const target of targets) {
                    target.appendChild(result.element);
                }
            },
            on(key: string, handler: (data: unknown) => void) {
                result.on(key, event => event instanceof CustomEvent ? handler(event.detail) : null);
                return this;
            },
            $: result
        }, COMPONENT_INSTANCE);
    };
    return Object.assign(entryRenderer, {
        props: propStore,
        events: options.events
    } as Component<P, E[]>);
}