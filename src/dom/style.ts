export type StyleSet = {
    [K in keyof CSSStyleDeclaration]: (data: string) => StyleSet;
} & {
    rules: Record<keyof CSSStyleDeclaration, string>;
    toString(): string;
};
export function styleSet() {
    const rules = {} as Record<keyof CSSStyleDeclaration, string>;
    const context: StyleSet = new Proxy({
        rules,
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