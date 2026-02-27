import { $, createComponent, tree, sync, styleSet, createArray, when, defineEvent } from "@";

export default createComponent({ //创建组件
    props: {
        value: { //参数名
            validate: Number.isInteger, //验证器
            transform: Number, //转换器
            required: false, //是否必填
            shadow: 0, //默认值
            downloadable: true, //（上游→下游）
            uploadable: true, //（下游→上游），v-model双向绑定
        }
    },
    events: [
        defineEvent("up", {
            template: {
                arg1: 0,
                arg2: false
            },
            bubbleable: true
        }),
        defineEvent("down", {
            template: {
                arg3: "sb",
                arg4: Symbol()
            },
            bubbleable: true
        })
    ]
}, (props) => {
    const doubled = sync(() => props.value.get() * 2, [props.value]); //computed
    return tree("div")
        .use(styleSet().fontSize("20px").padding("10px"))
        .append(
            "敲木鱼", tree("br"),
            tree("button")
                .on("click", () => props.value.set(props.value.get() + 1)) //参数uploadable，赋值会实时同步到上游
                .append("点击加一"),
            tree("button")
                .on("click", () => props.value.set(props.value.get() - 1))
                .append("点击减一"),
            tree("br"),
            "当前值：", $(props.value), //引用响应式的值，类似模板语法{{ count }}
            "双倍值：", $(doubled),
            $(sync( //只要是能渲染的东西，就能进行响应式引用
                () => createArray(
                    doubled.get(),
                    () => tree("div").append("你点了一下")
                ),
                [doubled]
            )), //列表渲染v-for
            when(
                () => props.value.get() > 10,
                () => tree("p").append("count > 10 时显示"),
                [props.value]
            ), //条件渲染v-if
        );
});