import { EmptyValue } from "@/util/types";
import { HostTree, tree } from "../element";
import { PropertyDescriptor, PropertyInputDict, PropertyOutputDict, bridgeProperty, normalizePropertyDescriptor, validateStore } from "./property";
import { Wrapper } from "../reactive";
import { SlotInputDict, SlotOutputDict, renderSlots, SlotDescriptor } from "./slot";
import { BrokenRendererError, TooEarly } from "@/exceptions";
import { attachFlag, COMPONENT_INSTANCE, HOST_TREE, matchFlag } from "@/constants/flags";
import { EventDescriptor } from "./event";
import { StyleSet } from "../element/style";
import { camelToHyphen } from "@/util";
import { attachUUID, flagment } from "./uuid";

export interface ComponentRenderEntry<P extends ComponentPropertyStore, E extends ComponentEventStore, S extends ComponentSlotStore, A extends boolean> {
    (props?: PropertyInputDict<P>, slot?: SlotInputDict<S>): A extends true ? Promise<ComponentInstance<E>> : ComponentInstance<E>;
}
export interface ComponentEmitMethod<E extends ComponentEventStore> {
    <D extends E[number], K extends D["name"]>(
        key: K,
        data: D extends infer R extends EventDescriptor ? R["name"] extends K ? R["template"] : never : never
    ): void;
    instance: ComponentInstance<E> | null;
}
export interface ComponentInternalRender<P extends ComponentPropertyStore, E extends ComponentEventStore, S extends ComponentSlotStore, A extends boolean> {
    (
        options: PropertyOutputDict<P>,
        slot: SlotOutputDict<S>,
        emit: ComponentEmitMethod<E>
    ): A extends true ? Promise<SourceTree> : SourceTree;
}
export type Component<P extends ComponentPropertyStore, E extends ComponentEventStore, S extends ComponentSlotStore, A extends boolean> =
    ComponentRenderEntry<P, E, S, A> & ComponentOption<P, E, S>;

export type ComponentPropertyStore = Record<string, PropertyDescriptor>;
export type ComponentEventStore = EventDescriptor[];
export type ComponentSlotStore = SlotDescriptor[];

export interface ComponentOption<P extends ComponentPropertyStore, E extends ComponentEventStore, S extends ComponentSlotStore> {
    props?: P;
    events?: E;
    styles?: StyleSet[];
    slots?: S;
    uuid?: string;
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

export function createComponent<
    P extends ComponentPropertyStore,
    E extends EventDescriptor,
    S extends SlotDescriptor
>(
    options: ComponentOption<P, E[], S[]>,
    internalRenderer: ComponentInternalRender<P, E[], S[], true>
): Component<P, E[], S[], true>
export function createComponent<
    P extends ComponentPropertyStore,
    E extends EventDescriptor,
    S extends SlotDescriptor
>(
    options: ComponentOption<P, E[], S[]>,
    internalRenderer: ComponentInternalRender<P, E[], S[], false>
): Component<P, E[], S[], false>
export function createComponent<
    P extends ComponentPropertyStore,
    E extends EventDescriptor,
    S extends SlotDescriptor
>(
    options: ComponentOption<P, E[], S[]>,
    internalRenderer: ComponentInternalRender<P, E[], S[], boolean>
): Component<P, E[], S[], boolean> {
    validateStore(options.props ?? {});
    const propStore = Object.fromEntries(
        Object
            .entries(options.props ?? {})
            .map(([key, value]) => [
                key,
                normalizePropertyDescriptor(value),
            ])
    ) as P;
    const rawUUID = camelToHyphen(options.uuid || crypto.randomUUID());
    const flagmentUUID = flagment(rawUUID);
    if (options.styles) {
        for (const styleSet of options.styles) {
            styleSet.apply(`[data-${flagmentUUID}="true"]`);
        }
    }
    const entryRenderer = (props?: PropertyInputDict<P>, slot?: SlotInputDict<S[]>) => {
        let treeInitialized = false;

        const events: [string, unknown, EventDescriptor][] = [];
        const emitEventQueue = (hostTree: HostTree) => {
            if (!treeInitialized) return;
            let eventEmit;
            while (eventEmit = events.shift()) {
                const [key, data, descriptor] = eventEmit;
                hostTree.element.dispatchEvent(new CustomEvent(key, {
                    detail: data,
                    bubbles: descriptor.bubbleable,
                    cancelable: false
                }));
            }
        };
        const instantiate = (sourceTree: SourceTree) => {
            const hostTree = render(sourceTree);
            attachUUID(hostTree.element, rawUUID);
            hostTree.hooks.treeUpdated.subcribe((newTrees) => {
                for (const newTree of newTrees) {
                    attachUUID(newTree.element, rawUUID);
                }
            });
            treeInitialized = true;
            emitEventQueue(hostTree);
            return attachFlag({
                mount(to: string | HTMLElement) {
                    if (!hostTree || !treeInitialized) throw new TooEarly();
                    const targets = typeof to === "string" ? [...document.querySelectorAll<HTMLElement>(to)] : [to];
                    for (const target of targets) {
                        target.appendChild(hostTree.element);
                    }
                    return this;
                },
                on(key: string, handler: (data: unknown) => void) {
                    hostTree.element.addEventListener(key, event => event instanceof CustomEvent ? handler(event.detail) : null);
                    return this;
                },
                $: hostTree
            }, COMPONENT_INSTANCE) as ComponentInstance;
        };

        let hostTree: HostTree | null = null;
        const properties = bridgeProperty(props, propStore);
        const slots = renderSlots(slot, options.slots);
        const emit = Object.assign((key: string, data: unknown) => {
            if (!hostTree || !treeInitialized) throw new TooEarly();
            const targetEvent = options.events?.find(e => e.name === key);
            if (!targetEvent) throw new TypeError(`No component events named ${key} to emit.`);
            events.push([key, data, targetEvent]);
            emitEventQueue(hostTree);
        }, {
            instance: null as ComponentInstance | null
        });
        const sourceTree = internalRenderer(properties, slots, emit);
        if (sourceTree instanceof Promise) {
            return sourceTree
                .then(instantiate)
                .then(instance => {
                    hostTree = instance.$;
                    emit.instance = instance;
                    return instance;
                });
        } else {
            const instance = instantiate(sourceTree);
            hostTree = instance.$;
            emit.instance = instance;
            return instance;
        }
    };
    return Object.assign(entryRenderer, {
        props: propStore,
        events: options.events
    } as Component<P, E[], S[], boolean>);
}

export * from "./event";
export * from "./property";
export * from "./slot";
export * from "./uuid";
