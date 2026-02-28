import {
    $,
    createComponent,
    defineEvent,
    defineSlot,
    defineTemplate,
    typed,
    styleSet,
    sync,
    tree,
    when,
    wrap
} from "@";

export default createComponent({ //在组件配置中声明插槽
    props: {
        items: {
            transform: typed<string[]>(),
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
            template: defineTemplate<string>(), //插槽作用域的数据类型
            required: false, //插槽是否必填
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
                    slot.title(text) //像正常元素一样，把插槽查到想要的位置（参数类型在定义时给出）
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