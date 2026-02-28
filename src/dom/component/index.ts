import { EmptyValue } from "@/util/types";
import { HostTree, tree } from "../element";
import { PropertyDescriptor, PropertyInputDict, PropertyOutputDict, hostdown, normalizePropertyDescriptor, validateStore } from "./property";
import { Wrapper } from "../reactive";
import { SlotInputDict, SlotOutputDict, renderSlots, SlotDescriptor } from "./slot";
import { BrokenRendererError } from "@/exceptions";
import { attachFlag, COMPONENT_INSTANCE, HOST_TREE, matchFlag } from "@/constants/flags";
import { EventDescriptor } from "./event";
import { StyleSet } from "../element/style";

export interface ComponentRenderEntry<P extends ComponentPropertyStore, E extends ComponentEventStore, S extends ComponentSlotStore> {
    (props?: PropertyInputDict<P>, slot?: SlotInputDict<S>): ComponentInstance<E>;
}
export interface ComponentInternalRender<P extends ComponentPropertyStore, E extends ComponentEventStore, S extends ComponentSlotStore> {
    (
        options: PropertyOutputDict<P>,
        slot: SlotOutputDict<S>,
        emit: <D extends E[number], K extends D["name"]>(
            key: K,
            data: D extends infer R extends EventDescriptor ? R["name"] extends K ? R["template"] : never : never
        ) => void
    ): SourceTree;
}
export type Component<P extends ComponentPropertyStore, E extends ComponentEventStore, S extends ComponentSlotStore> =
    ComponentRenderEntry<P, E, S> & ComponentOption<P, E, S>;

export type ComponentPropertyStore = Record<string, PropertyDescriptor>;
export type ComponentEventStore = EventDescriptor[];
export type ComponentSlotStore = SlotDescriptor[];

export interface ComponentOption<P extends ComponentPropertyStore, E extends ComponentEventStore, S extends ComponentSlotStore> {
    props?: P;
    events?: E;
    styles?: StyleSet[];
    slots?: S;
}
export type ComponentInstance<E extends ComponentEventStore = ComponentEventStore> = {
    mount(to: string | HTMLElement): void;
    on<D extends E[number], K extends D["name"]>(
        key: K,
        data: (data: D extends infer R extends EventDescriptor ? R["name"] extends K ? R["template"] : never : never) => void
    ): ComponentInstance<E>;
    $: HostTree;
};
export type RawSourceTree = [
    HTMLElement,
    string,
    number,
    boolean,
    bigint,
    EmptyValue,
    ComponentInstance,
][number];
export type SourceTree = RawSourceTree | HostTree;

export function render(nodeTree: SourceTree): HostTree {
    let result: HostTree;
    if (nodeTree instanceof Node) {
        result = tree(nodeTree);
    } else if (typeof nodeTree === "string" || typeof nodeTree === "number" || typeof nodeTree === "boolean" || typeof nodeTree === "bigint") {
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
    E extends EventDescriptor,
    S extends SlotDescriptor
>(
    options: ComponentOption<P, E[], S[]>,
    internalRenderer: ComponentInternalRender<P, E[], S[]>
): Component<P, E[], S[]> {
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
    const entryRenderer = (props?: PropertyInputDict<P>, slot?: SlotInputDict<S[]>) => {
        let treeInitialized = false;

        let events: [string, unknown, EventDescriptor][] = [];
        const emitEventQueue = () => {
            if (!treeInitialized) return;
            events.forEach(([key, data, event]) => hostTree.element.dispatchEvent(new CustomEvent(key, {
                detail: data,
                bubbles: event.bubbleable,
                cancelable: false
            })));
            events = [];
        };

        const sourceTree = internalRenderer(
            hostdown(props, propStore),
            renderSlots(slot, options.slots),
            (key, data) => {
                const targetEvent = options.events?.find(e => e.name === key);
                if (!targetEvent) throw new TypeError(`No events named ${key} to emit.`);
                events.push([key, data, targetEvent]);
                emitEventQueue();
            });
        const hostTree = render(sourceTree);
        attachUUID(hostTree.element, rawComponentUUID);
        hostTree.hooks.treeUpdated.subcribe((newTrees) => newTrees.forEach(tree => attachUUID(tree.element, rawComponentUUID)));
        treeInitialized = true;

        emitEventQueue();
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
    } as Component<P, E[], S[]>);
}

export * from "./event";
export * from "./property";
export * from "./slot";