import { camelToHyphen } from "@/util/char";
import { render, TreeResult } from "./component";
import { isWrapper, Wrapper } from "./reactive";
import { StyleSet } from "./style";
import { putIn } from "@/util/array";

export type TreeContext<T extends HTMLElement = HTMLElement> = {
    [K in keyof T as T[K] extends (...args: unknown[]) => unknown ? never : K]: (data: T[K] | Wrapper<T[K]>) => TreeContext<T>;
} & {
    element: T;
    append(...children: (
        TreeResult |
        TreeResult[] |
        Wrapper<TreeResult> |
        Wrapper<TreeResult[]> |
        Wrapper<TreeResult | TreeResult[]>
    )[]): TreeContext<T>;
    use(styleSet: StyleSet | Wrapper<StyleSet>): TreeContext<T>;
    on<E extends keyof HTMLElementEventMap>(key: E, handler: (data: HTMLElementEventMap[E]) => void, options?: AddEventListenerOptions): TreeContext<T>;
} & { [K in typeof treeContextSymbol]: true; };
export const treeContextSymbol = Symbol("TreeContextFlag");
export function isTreeContext<T extends HTMLElement>(data: unknown): data is TreeContext<T> {
    return !!data && Object.hasOwn(data, treeContextSymbol) && data[treeContextSymbol] === true;
}
export function tree<E extends keyof HTMLElementTagNameMap>(data: E | Node) {
    const element: Node = typeof data === "string" ? document.createElement(data) : data;
    const context: TreeContext<HTMLElementTagNameMap[E]> = new Proxy({
        element,
        append(...children: (TreeResult | TreeResult[] | Wrapper<TreeResult | TreeResult[]>)[]) {
            for (const child of children) {
                if (isWrapper<TreeResult | TreeResult[]>(child)) {
                    let oldChildren: TreeContext[] = [];
                    const baseAnchor = new Comment("Tree anchor");
                    element.appendChild(baseAnchor);
                    const update = (newTrees: TreeResult[] | TreeResult) => {
                        const normalizedTrees = [...(Array.isArray(newTrees) ? newTrees : [newTrees])];
                        const newChildren: TreeContext[] = [];
                        for (const newTree of normalizedTrees) {
                            const child = render(newTree);
                            newChildren.push(child);
                            element.insertBefore(child.element, baseAnchor.nextSibling);
                        }
                        for (const oldChild of oldChildren) {
                            oldChild.element.remove();
                        }
                        oldChildren = newChildren;
                    };
                    child.event.subcribe(update);
                    update(child.get());
                } else {
                    const children = child;
                    for (const child of putIn(children)) {
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
                if (isWrapper<StyleSet>(styleSet)) {
                    styleSet.event.subcribe((newData) => update(newData.rules));
                    update(styleSet.get().rules);
                } else {
                    update(styleSet.rules);
                }
            }
            return context;
        },
        on(key, handler, options) {
            if (element instanceof HTMLElement) {
                element.addEventListener(key, handler, options);
            }
            return context;
        },
        [treeContextSymbol]: true
    } as TreeContext<HTMLElementTagNameMap[E]>, {
        get<P extends keyof Node>(target: Record<string, unknown>, p: P, receiver: unknown) {
            if (Reflect.has(target, p)) {
                return Reflect.get(target, p, receiver);
            } else {
                return (data: HTMLElementTagNameMap[E][P] | Wrapper<HTMLElementTagNameMap[E][P]>) => {
                    if (isWrapper<HTMLElementTagNameMap[E][P]>(data)) {
                        const update = (newData: HTMLElementTagNameMap[E][P]) => element[p] = newData;
                        data.event.subcribe(update);
                        update(data.get());
                    } else {
                        element[p] = data;
                    }
                    return context;
                };
            }
        },
    });
    return context;
}