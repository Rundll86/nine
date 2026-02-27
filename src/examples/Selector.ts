import {
    $,
    createComponent,
    defineEvent,
    defineSlot,
    defineTemplate,
    rawProperty,
    styleSet,
    sync,
    tree,
    when,
    wrap
} from "@";

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
        defineEvent("select", { template: defineTemplate<number>() }),
        defineEvent("toggleState", { template: defineTemplate<boolean>() })
    ],
    styles: [
        styleSet(".item")
            .backgroundColor("blue")
            .color("white"),
        styleSet(".flexdown")
            .display("flex")
            .flexDirection("column")
    ],
    slots: [
        defineSlot("title", {
            template: defineTemplate<string>(),
        })
    ]
}, (props, slot, emit) => {
    const showing = wrap(false);
    const text = sync(() =>
        props.items.get()[props.value.get()]
        , [props.items, props.value]);

    const select = (index: number) => {
        props.value.set(index);
        showing.set(false);
        emit("select", props.value.get());
    };
    showing.event.subcribe(e => emit("toggleState", e));

    return tree("div")
        .class("flexdown")
        .ariaAtomic("false")
        .append(
            tree("span")
                .class("item")
                .use(styleSet().backgroundColor("red"))
                .append(
                    tree("div").append($(text)),
                    slot.title(text)
                )
                .on("click", () => showing.set(!showing.get())),
            when(showing, () =>
                tree("div")
                    .class("flexdown")
                    .append(
                        $(sync(() =>
                            props.items.get().map((label, index) =>
                                tree("span")
                                    .class("item")
                                    .append(label)
                                    .on("click", () => select(index))
                            ), [props.items]))
                    )
            )
        );
});