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

export default createComponent({
    props: {
        items: {
            validate: Array.isArray, //验证参数是否合法的方法
            transform: typed<string[]>(), //将输入的参数进行标准化的方法，typed()函数返回x=>x，仅类型检查
            required: true, //参数是否必填
            shadow: ["OptionA", "OptionB", "OptionC"], //默认值
            downloadable: true, //是否🉑下载，即上游组件向下游传递值
            uploadable: false //是否🉑上传，即下游组件向上游传递值
        },
        value: {
            transform: Number,
            uploadable: true, //组件的参数🉑上传，即v-model
            required: true
        }
    },
    events: [
        defineEvent("select", {
            template: defineTemplate<number>() //定义事件被触发时需要传递的数据类型
        }),
        defineEvent("toggleState", { template: defineTemplate<boolean>() })
    ],
    styles: [ //这些样式会被封装在组件所在的DOM域
        styleSet(".item")
            .backgroundColor("blue")
            .color("white"),
        styleSet(".flexdown")
            .display("flex")
            .flexDirection("column")
    ],
    slots: [
        defineSlot("title", {
            template: defineTemplate<string>(), //插槽作用域传值的数据类型
            required: false, //插槽是否必填
        })
    ]
}, (props, slot, emit) => {
    const showing = wrap(false); //ref包装一个数据，基于事件订阅的响应式系统
    const text = sync(() => //computed同步一个数据，任何一个依赖更新时都会引起自身的重新渲染
        props.items.get()[props.value.get()]
        , [props.items, props.value]); //🉑灵活的配置依赖列表

    const select = (index: number) => {
        props.value.set(index);
        showing.set(false);
        emit("select", props.value.get());
    };
    showing.event.subcribe(e => { //订阅一个包装器的更新事件
        emit("toggleState", e); //发布组件的自定义事件
    });

    return tree("div")
        .class("flexdown")
        .ariaAtomic("false")
        .append(
            tree("span")
                .class("item")
                .use(styleSet().backgroundColor("red")) //通过style赋值
                .append(
                    tree("div").append($(text)), //引用响应式包装器的值
                    slot.title(text) //像正常元素一样，把插槽查到想要的位置（参数类型在定义时给出）
                )
                .on("click", () => showing.set(!showing.get())),
            when(showing, () =>
                tree("div")
                    .class("flexdown")
                    .append(
                        $(sync(() => //只要包装器返回的数据🉑以被渲染，就🉑以通过$函数进行引用
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