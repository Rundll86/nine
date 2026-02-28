import { $, createComponent, tree, styleSet, sync, wrap } from "@";

export default createComponent({}, () => {
    const state = wrap<{
        count: number;
        label?: string;
        enabled: boolean;
    }>({
        count: 0,
        label: "hello",
        enabled: true,
    });

    const jsonView = sync(() => JSON.stringify(state.get()), [state]);
    const keysView = sync(() => Object.keys(state.get()).join(", "), [state]);

    const inc = () => { state.get().count += 1; };
    const toggle = () => { state.get().enabled = !state.get().enabled; };
    const rename = () => { state.get().label = `label-${state.get().count}`; };
    const removeLabel = () => { delete state.get().label; };
    const defineExtra = () => {
        Object.defineProperty(state.get(), "extra", {
            value: `extra-${Date.now()}`,
            configurable: true,
            enumerable: true,
            writable: true,
        });
    };

    return tree("div")
        .use(styleSet().padding("10px").border("1px solid #ddd").fontFamily("monospace"))
        .append(
            tree("h3").append("Object Watcher Test"),
            tree("div").append("keys: ", $(keysView)),
            tree("div").append("json: ", $(jsonView)),
            tree("div")
                .use(styleSet().display("flex").gap("6px").marginTop("8px").flexWrap("wrap"))
                .append(
                    tree("button").append("count++").on("click", inc),
                    tree("button").append("toggle enabled").on("click", toggle),
                    tree("button").append("rename label").on("click", rename),
                    tree("button").append("delete label").on("click", removeLabel),
                    tree("button").append("define extra").on("click", defineExtra),
                )
        );
});
