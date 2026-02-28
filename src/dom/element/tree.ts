import { camelToHyphen } from "@/util/char";
import { render, RawSourceTree, SourceTree } from "../component";
import { Wrapper } from "../reactive";
import { StyleSet } from "./style";
import { putIntoArray } from "@/util/array";
import { attachFlag, HOST_TREE, matchFlag, WRAPPER } from "@/constants/flags";
import { EventSubcriber } from "@/channel";
import { SupportedHTMLRawAttributes, SupportedHTMLElements, SupportedEventHandlerMap } from ".";
import { KebabToCamel, ObjectToEntryUnion } from "@/util/types";

export interface HostTreeHooks {
    treeUpdated: [newTrees: HostTree[], oldTrees: HostTree[]];
    attributeUpdated: [attribute: string, newValue: unknown, oldValue: unknown];
    initialized: [rootTree: HostTree];
    $preventEvent: [ObjectToEntryUnion<SupportedEventHandlerMap>, boolean | void];
}
export type HostTreeHookStore = {
    readonly [K in keyof HostTreeHooks as K extends `$${infer R}` ? R : K]:
    K extends `$${string}`
    ? HostTreeHooks[K] extends [infer E extends unknown[], infer R]
    ? EventSubcriber<E, R>
    : EventSubcriber<HostTreeHooks[K]>
    : EventSubcriber<HostTreeHooks[K]>;
};
export interface HostTreeAddEventListener<E extends SupportedHTMLElements> {
    <K extends keyof SupportedEventHandlerMap>(
        key: K,
        handler: SupportedEventHandlerMap[K],
        options?: AddEventListenerOptions
    ): HostTree<E>;
    (
        key: string,
        handler: (...args: unknown[]) => unknown,
        options?: AddEventListenerOptions
    ): HostTree<E>;
}
export type HostTreeOnMethod<E extends SupportedHTMLElements> = HostTreeAddEventListener<E> & {
    prevent: HostTreeAddEventListener<E> & {
        stop: HostTreeAddEventListener<E>;
    };
    stop: HostTreeAddEventListener<E> & {
        prevent: HostTreeAddEventListener<E>;
    };
};
export type HostTree<E extends SupportedHTMLElements = SupportedHTMLElements, T = HTMLElementTagNameMap[E], A = SupportedHTMLRawAttributes[E]> = {
    [K in string & keyof A as KebabToCamel<K>]-?: (data: A[K] | Wrapper<A[K]>) => HostTree<E>;
} & {
    readonly element: T;
    readonly hooks: HostTreeHookStore;
    append(...children: (
        RawSourceTree |
        HostTree |
        RawSourceTree[] |
        HostTree[] |
        (RawSourceTree | HostTree)[] |
        Wrapper<HostTree> |
        Wrapper<RawSourceTree> |
        Wrapper<RawSourceTree | HostTree> |
        Wrapper<(RawSourceTree | HostTree)[]> |
        Wrapper<RawSourceTree | RawSourceTree[]>
    )[]): HostTree<E>;
    use(styleSet: StyleSet | Wrapper<StyleSet>): HostTree<E>;
    data(datasets: Record<string, string | Wrapper<string>>): HostTree<E>;
    on: HostTreeOnMethod<E>;
};

function createAddEventListener<E extends SupportedHTMLElements>(element: Node, context: HostTree<E>, prevent: boolean, stop: boolean, hooks: HostTreeHookStore) {
    return <K extends keyof SupportedEventHandlerMap>(key: K, handler: SupportedEventHandlerMap[K], options: AddEventListenerOptions) => {
        if (element instanceof EventTarget) {
            element.addEventListener(key, (e) => {
                if (e instanceof CustomEvent) return;
                if (prevent) e.preventDefault();
                if (stop) e.stopPropagation();
                //@ts-expect-error 运行时这个本来就是配套的，ts推断不出来
                const emitResult = hooks.preventEvent.emit(key, handler);
                if (emitResult && !emitResult.some(Boolean)) {
                    //@ts-expect-error 依旧是传参问题，ts推断不出来
                    handler(e);
                }
            }, options);
        }
        return context;
    };
}
export function tree<E extends SupportedHTMLElements>(data: E | Node) {
    const element: Node = typeof data === "string" ? document.createElement(data) : data;
    const hooks: HostTreeHookStore = {
        treeUpdated: new EventSubcriber({ bubbleable: true }),
        attributeUpdated: new EventSubcriber(),
        initialized: new EventSubcriber(),
        preventEvent: new EventSubcriber()
    };
    const context: HostTree<E> = new Proxy(attachFlag({
        element,
        hooks,
        append(...children: (
            RawSourceTree |
            HostTree |
            RawSourceTree[] |
            HostTree[] |
            (RawSourceTree | HostTree)[] |
            Wrapper<HostTree> |
            Wrapper<RawSourceTree> |
            Wrapper<RawSourceTree | HostTree> |
            Wrapper<(RawSourceTree | HostTree)[]> |
            Wrapper<RawSourceTree | RawSourceTree[]>
        )[]) {
            for (const child of children) {
                if (matchFlag<
                    RawSourceTree
                    | HostTree
                    | RawSourceTree[]
                    | HostTree[]
                    | (RawSourceTree | HostTree)[],
                    typeof WRAPPER
                        >(child, WRAPPER)) {
                    let oldChildren: HostTree[] = [];
                    const baseAnchor = new Comment("Tree anchor");
                    element.appendChild(baseAnchor);
                    const update = (
                        newTrees:
                            RawSourceTree
                            | HostTree
                            | RawSourceTree[]
                            | HostTree[]
                            | (RawSourceTree | HostTree)[]
                    ) => {
                        const normalizedTrees = [...(Array.isArray(newTrees) ? newTrees : [newTrees])].reverse();
                        const newChildren: HostTree[] = [];
                        for (const newTree of normalizedTrees) {
                            const child = render(newTree);
                            child.hooks.treeUpdated.parent = hooks.treeUpdated;
                            newChildren.push(child);
                            element.insertBefore(child.element, baseAnchor.nextSibling);
                        }
                        for (const oldChild of oldChildren) {
                            oldChild.element.remove();
                        }
                        hooks.treeUpdated.emit(newChildren, oldChildren);
                        oldChildren = newChildren;
                    };
                    child.event.subcribe(update);
                    update(child.get());
                } else {
                    const children = child;
                    const newTrees: HostTree[] = [];
                    for (const child of putIntoArray(children)) {
                        const hostTree = matchFlag(child, HOST_TREE) ? child : render(child as SourceTree);
                        hostTree.hooks.treeUpdated.parent = hooks.treeUpdated;
                        element.appendChild(hostTree.element);
                        newTrees.push(hostTree);
                    }
                    hooks.treeUpdated.emit(newTrees, []);
                }
            }
            return context;
        },
        use(styleSet: StyleSet | Wrapper<StyleSet>) {
            if (element instanceof HTMLElement) {
                const update = (rules: Record<string, string>) => {
                    for (const [key, value] of Object.entries(rules)) {
                        element.style.setProperty(camelToHyphen(String(key)), value);
                    }
                };
                if (matchFlag<StyleSet, typeof WRAPPER>(styleSet, WRAPPER)) {
                    styleSet.event.subcribe((newData) => update(newData.rules));
                    update(styleSet.get().rules);
                } else {
                    update(styleSet.rules);
                }
            }
            return context;
        },
        data(datasets) {
            if (!(element instanceof HTMLElement)) return;
            for (const [key, value] of Object.entries(datasets)) {
                const update = (newData: string) => element.dataset[key] = newData;
                if (matchFlag<string, typeof WRAPPER>(value, WRAPPER)) {
                    value.event.subcribe(update);
                    update(value.get());
                } else {
                    update(value);
                }
            }
            return context;
        }
    } as HostTree<E>, HOST_TREE), {
        get<P extends keyof Node>(target: Record<string, unknown>, p: P, receiver: unknown) {
            if (Reflect.has(target, p)) {
                return Reflect.get(target, p, receiver);
            } else {
                return (data: HTMLElementTagNameMap[E][P] | Wrapper<HTMLElementTagNameMap[E][P]>) => {
                    const update = (newData: HTMLElementTagNameMap[E][P], oldData: HTMLElementTagNameMap[E][P]) => {
                        if (Object.hasOwn(element, p)) {
                            element[p] = newData;
                        }
                        if (element instanceof Element) {
                            element.setAttribute(camelToHyphen(p), String(newData));
                        }
                        hooks.attributeUpdated.emit(p, newData, oldData);
                    };
                    if (matchFlag<HTMLElementTagNameMap[E][P], typeof WRAPPER>(data, WRAPPER)) {
                        data.event.subcribe(update);
                        update(data.get(), data.get());
                    } else {
                        update(data, data);
                    }
                    return context;
                };
            }
        },
    });
    context.on = Object.assign(
        createAddEventListener(element, context, false, false, hooks),
        {
            stop: Object.assign(
                createAddEventListener(element, context, false, true, hooks),
                {
                    prevent: createAddEventListener(element, context, true, true, hooks)
                }
            ),
            prevent: Object.assign(
                createAddEventListener(element, context, true, false, hooks),
                {
                    stop: createAddEventListener(element, context, true, true, hooks)
                }
            )
        }
    ) as HostTreeOnMethod<E>;
    Promise.resolve().then(() => hooks.initialized.emit(context as unknown as HostTree));
    return context;
}