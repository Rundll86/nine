import { camelToHyphen } from "@/util/char";
import { normalizeTree, TreeResult } from "./component";
import { isWrapper, Wrapper } from "./reactive";
import { StyleSet } from "./style";

export type TreeContext<T extends HTMLElement = HTMLElement> = {
    [K in keyof T as T[K] extends (...args: unknown[]) => unknown ? never : K]: (data: T[K] | Wrapper<T[K]>) => TreeContext<T>;
} & {
    element: T;
    append(...children: (TreeResult | Wrapper<TreeResult[]>)[]): TreeContext<T>;
    use(styleSet: StyleSet | Wrapper<StyleSet>): TreeContext<T>;
    on<E extends keyof HTMLElementEventMap>(key: E, handler: (data: HTMLElementEventMap[E]) => void, options?: AddEventListenerOptions): TreeContext<T>;
};
export function tree<E extends keyof HTMLElementTagNameMap>(data: E | Node) {
    const element: Node = typeof data === "string" ? document.createElement(data) : data;
    const context: TreeContext<HTMLElementTagNameMap[E]> = new Proxy({
        element,
        append(...children: (TreeResult | Wrapper<TreeResult[]>)[]) {
            for (const child of children) {
                if (!isWrapper<TreeResult[]>(child)) { //插入的不是响应式，直接用
                    element.appendChild(normalizeTree(child).element);
                    continue;
                }
                let oldChildren: TreeContext[] = [];
                const baseAnchor = new Comment("Just an anchor"); //把锚点存起来，树更新时把新节点加到这个锚点后面
                element.appendChild(baseAnchor);
                const update = (newTrees: TreeResult[]) => {
                    const newChildren: TreeContext[] = [];
                    for (const newTree of newTrees) {
                        const child = normalizeTree(newTree);
                        newChildren.push(child);
                        element.insertBefore(child.element, baseAnchor.nextSibling); //是要插在锚点的后面，不是前面
                    }
                    for (const oldChild of oldChildren) { //新节点创建后把旧的删掉
                        oldChild.element.remove();
                    }
                    oldChildren = newChildren; //下一次更新时，这一次更新的节点就成旧节点了
                };
                child.event.subcribe(update); //订阅响应式对象的事件
                update(child.get());
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