import { $, createComponent, defineEvent, rawProperty, styleSet, sync, tree, when, wrap } from "@";

const option = styleSet().backgroundColor("blue").color("white");
const flexdown = styleSet().display("flex").flexDirection("column");
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
        .use(flexdown)
        .append(
            tree("span")
                .use(option).use(styleSet().backgroundColor("red"))
                .textContent(sync(() => props.items.get()[props.value.get()], [props.items, props.value]))
                .on("click", () => showing.set(!showing.get())),
            slot(),
            when(showing, () =>
                tree("div")
                    .use(flexdown)
                    .append(
                        $(sync(() =>
                            props.items.get().map((label, index) =>
                                tree("span")
                                    .use(option)
                                    .textContent(label)
                                    .on("click", () => select(index))
                            ), [props.items]))
                    )
            )
        );
});