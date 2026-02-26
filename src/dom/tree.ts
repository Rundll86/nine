import { camelToHyphen } from "@/util/char";
import { render, SourceTree } from "./component";
import { Wrapper } from "./reactive";
import { StyleSet } from "./style";
import { putIn } from "@/util/array";
import { appendFlag, HOST_TREE, matchFlag, WRAPPER } from "@/constants/flags";

export type HostTree<T extends HTMLElement = HTMLElement> = {
    [K in keyof T as T[K] extends (...args: unknown[]) => unknown ? never : K]: (data: T[K] | Wrapper<T[K]>) => HostTree<T>;
} & {
    element: T;
    append(...children: (
        SourceTree |
        SourceTree[] |
        Wrapper<SourceTree> |
        Wrapper<SourceTree[]> |
        Wrapper<SourceTree | SourceTree[]>
    )[]): HostTree<T>;
    use(styleSet: StyleSet | Wrapper<StyleSet>): HostTree<T>;
    on<E extends keyof HTMLElementEventMap>(key: E, handler: (data: HTMLElementEventMap[E]) => void, options?: AddEventListenerOptions): HostTree<T>;
};

export function tree<E extends keyof HTMLElementTagNameMap>(data: E | Node) {
    const element: Node = typeof data === "string" ? document.createElement(data) : data;
    const context: HostTree<HTMLElementTagNameMap[E]> = new Proxy(appendFlag({
        element,
        append(...children: (SourceTree | SourceTree[] | Wrapper<SourceTree | SourceTree[]>)[]) {
            for (const child of children) {
                if (matchFlag<SourceTree | SourceTree[], typeof WRAPPER>(child, WRAPPER)) {
                    let oldChildren: HostTree[] = [];
                    const baseAnchor = new Comment("Tree anchor");
                    element.appendChild(baseAnchor);
                    const update = (newTrees: SourceTree[] | SourceTree) => {
                        const normalizedTrees = [...(Array.isArray(newTrees) ? newTrees : [newTrees])];
                        const newChildren: HostTree[] = [];
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
                if (matchFlag<StyleSet, typeof WRAPPER>(styleSet, WRAPPER)) {
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
    } as HostTree<HTMLElementTagNameMap[E]>, HOST_TREE), {
        get<P extends keyof Node>(target: Record<string, unknown>, p: P, receiver: unknown) {
            if (Reflect.has(target, p)) {
                return Reflect.get(target, p, receiver);
            } else {
                return (data: HTMLElementTagNameMap[E][P] | Wrapper<HTMLElementTagNameMap[E][P]>) => {
                    if (matchFlag<HTMLElementTagNameMap[E][P], typeof WRAPPER>(data, WRAPPER)) {
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