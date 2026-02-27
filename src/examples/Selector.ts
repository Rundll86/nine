import { $, createComponent, defineEvent, rawProperty, styleSet, sync, tree, when, wrap } from "@";

export default createComponent({
    props: {
        items: {
            transform: rawProperty<string[]>(),
            shadow: ["OptionA", "OptionB", "OptionC"]
        },
        value: {
            transform: Number,
            uploadable: true,
            required: true
        }
    },
    events: [
        defineEvent("select", { template: 0 }),
        defineEvent("toggleState", { template: false })
    ],
    styles: [
        styleSet(".item")
            .backgroundColor("blue")
            .color("white"),
        styleSet(".flexdown")
            .display("flex")
            .flexDirection("column")
    ]
}, (props, slot, emit) => {
    const showing = wrap(false);
    const select = (index: number) => {
        props.value.set(index);
        showing.set(false);
        emit("select", props.value.get());
    };
    showing.event.subcribe(e => emit("toggleState", e));

    return tree("div")
        .className("flexdown")
        .append(
            tree("span")
                .className("item")
                .use(styleSet().backgroundColor("red"))
                .textContent(sync(() => props.items.get()[props.value.get()], [props.items, props.value]))
                .on("click", () => showing.set(!showing.get())),
            slot(),
            when(showing, () =>
                tree("div")
                    .className("flexdown")
                    .append(
                        $(sync(() =>
                            props.items.get().map((label, index) =>
                                tree("span")
                                    .className("item")
                                    .textContent(label)
                                    .on("click", () => select(index))
                            ), [props.items]))
                    )
            )
        );
});