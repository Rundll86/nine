import { $, createComponent, tree, sync, styleSet, createArray, when, wrap, TreeResult } from "@";

export default createComponent({ //创建组件
    props: {
        initial: { //参数名
            validate: Number.isInteger, //验证器
            transform: Number, //转换器
            required: false, //是否必填
            shadow: 0, //默认值
        }
    }
}, (props) => {
    const count = wrap(props.initial); //ref
    const doubled = sync(() => count.get() * 2, [count]); //computed
    return tree("div")
        .use(styleSet().fontSize("20px").padding("10px"))
        .append(
            "敲木鱼", tree("br"),
            tree("button")
                .on("click", () => count.set(count.get() + 1))
                .textContent("点击加一"),
            tree("button")
                .on("click", () => count.set(count.get() - 1))
                .textContent("点击减一"),
            tree("br"),
            "当前值：", $(count), //引用响应式的值，类似模板语法{{ count }}
            "双倍值：", $(doubled),
            sync<TreeResult[]>(() => createArray(doubled.get(), () => tree("div").textContent("你点了一下")), [doubled]), //列表渲染v-for
            when(() => count.get() > 10, () => tree("p").textContent("count > 10 时显示"), [count]), //条件渲染v-if
        );
});