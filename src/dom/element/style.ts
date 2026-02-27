import { camelToHyphen } from "@/util";

export type StyleSet = {
    [K in keyof CSSStyleDeclaration]: (data: string) => StyleSet;
} & {
    rules: Record<keyof CSSStyleDeclaration, string>;
    selector?: string;
    apply(selector?: string): StyleSet;
    ruleString(): string;
    selectorString(selector?: string): string;
};
export function styleSet(selector?: string) {
    const rules = {} as Record<keyof CSSStyleDeclaration, string>;
    const context: StyleSet = new Proxy({
        rules,
        selector,
        apply(selector) {
            const style = document.createElement("style");
            document.head.appendChild(style);
            style.textContent = `${this.selectorString(selector)}{${this.ruleString()}}`;
        },
        ruleString() {
            return Object.entries(rules).map(([key, value]) => `${camelToHyphen(String(key))}:${value};`).join("");
        },
        selectorString(selector) {
            return ((this.selector || "") + (selector || "")) || "*";
        },
    } as StyleSet, {
        get<P extends string & keyof CSSStyleDeclaration>(target: Record<string, unknown>, p: P, receiver: unknown) {
            if (Reflect.has(target, p)) {
                return Reflect.get(target, p, receiver);
            } else {
                return (data: CSSStyleDeclaration[P]) => {
                    rules[p] = String(data);
                    return context;
                };
            }
        },
    });
    return context;
}