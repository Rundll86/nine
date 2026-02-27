import { camelToHyphen } from "@/util/char";
import { render, RawSourceTree } from "./component";
import { Wrapper } from "./reactive";
import { StyleSet } from "./style";
import { putIntoArray } from "@/util/array";
import { attachFlag, HOST_TREE, matchFlag, WRAPPER } from "@/constants/flags";
import { EventSubcriber } from "@/channel";
import { SupportedHTMLRawAttributes, SupportedHTMLElements, SupportedEventHandlerMap } from "./element";
import { KebabToCamel, ObjectToEntryUnion, Valueof } from "@/util/types";

export interface HostTreeHooks {
    treeUpdated: [newTrees: HostTree[], oldTrees: HostTree[]];
    attributeUpdated: [attribute: string, newValue: unknown, oldValue: unknown];
    initialized: [rootTree: HostTree];
    $event: [ObjectToEntryUnion<SupportedEventHandlerMap>, boolean | void];
}
export type HostTreeHookStore = {
    [K in keyof HostTreeHooks as K extends `$${infer R}` ? R : K]:
    K extends `$${string}`
    ? HostTreeHooks[K] extends [infer E extends unknown[], infer R]
    ? EventSubcriber<E, R>
    : EventSubcriber<HostTreeHooks[K]>
    : EventSubcriber<HostTreeHooks[K]>;
};
export type HostTree<E extends SupportedHTMLElements = SupportedHTMLElements, T = HTMLElementTagNameMap[E], A = SupportedHTMLRawAttributes[E]> = {
    [K in string & keyof A as KebabToCamel<K>]-?: (data: A[K] | Wrapper<A[K]>) => HostTree<E>;
} & {
    element: T;
    hooks: HostTreeHookStore;
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
    on<K extends keyof SupportedEventHandlerMap>(key: K, handler: SupportedEventHandlerMap[K], options?: AddEventListenerOptions): HostTree<E>;
    on(key: string, handler: (...args: unknown[]) => unknown, options?: AddEventListenerOptions): HostTree<E>;
};

export function tree<E extends SupportedHTMLElements>(data: E | Node) {
    const element: Node = typeof data === "string" ? document.createElement(data) : data;
    const hooks: HostTreeHookStore = {
        treeUpdated: new EventSubcriber(),
        attributeUpdated: new EventSubcriber(),
        initialized: new EventSubcriber(),
        event: new EventSubcriber()
    };
    const context: HostTree<E> = new Proxy(attachFlag({
        element,
        hooks,
        append(...children: (RawSourceTree | RawSourceTree[] | Wrapper<RawSourceTree | RawSourceTree[]>)[]) {
            for (const child of children) {
                if (matchFlag<RawSourceTree | RawSourceTree[], typeof WRAPPER>(child, WRAPPER)) {
                    let oldChildren: HostTree[] = [];
                    const baseAnchor = new Comment("Tree anchor");
                    element.appendChild(baseAnchor);
                    const update = (newTrees: RawSourceTree[] | RawSourceTree) => {
                        const normalizedTrees = [...(Array.isArray(newTrees) ? newTrees : [newTrees])].reverse();
                        const newChildren: HostTree[] = [];
                        for (const newTree of normalizedTrees) {
                            const child = render(newTree);
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
                    for (const child of putIntoArray(children)) {
                        element.appendChild(render(child).element);
                    }
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
        on<K extends keyof SupportedEventHandlerMap>(key: K, handler: SupportedEventHandlerMap[K], options: AddEventListenerOptions) {
            if (element instanceof EventTarget) {
                element.addEventListener(key, (e) => {
                    //@ts-ignore
                    const emitResult = hooks.event.emit(key, handler);
                    if (emitResult && !emitResult.some(Boolean)) {
                        //@ts-ignore
                        handler(e);
                    }
                }, options);
            }
            return context;
        },
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
    Promise.resolve().then(() => hooks.initialized.emit(context as unknown as HostTree));
    return context;
}