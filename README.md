# nine-9

一个轻量、高性能、类型安全的 Vanilla DOM 响应式 UI 框架。

融合了 Vue 模板指令和 React Hooks 的优点，取两者之长。
同时运行及其轻量，甚至打包后可以用于 **UserScript**。

## 特性

- **响应式** - 数据变化时自动更新 UI
- **差量更新** - 只更新变化的 DOM，速度更快
- **类型安全** - 完整的 TypeScript 支持，类型推断优秀
- **轻量级** - 无依赖，打包后体积小巧
- **链式 API** - 流畅的 DOM 操作
- **Vue 风格指令** - 熟悉的 v-if、v-for 模式
- **JSX 风格表达式** - 响应式表达式可以放在模板任意位置
- **数据同步系统** - 使用完全基于表达式的语法实现数据实时响应

## 安装

```bash
npm install nine-9
```

## 示例用法

```typescript
//Selector.ts

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
            validate: Array.isArray, //验证参数是否合法
            transform: typed<string[]>(), //将输入的参数进行标准化，typed()函数不进行任何处理，只是类型投射
            required: true, //参数是否必填
            shadow: ["OptionA", "OptionB", "OptionC"], //默认值
            downloadable: true, //是否可下载，即上游组件向下游传递值
            uploadable: false //是否可上传，即下游组件向上游传递值
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
                        $(sync(() => //只要包装器返回的数据可以被渲染，就可以通过$函数进行引用
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
```

## 与 Vue 对比

| nine-9                   | Vue          | 说明           |
|--------------------------|--------------|----------------|
| `wrap()`                 | `ref()`      | 创建响应式引用 |
| `sync()`                 | `computed()` | 响应式计算值   |
| `when(condition, tree)`  | `v-if`       | 条件渲染       |
| `sync(() => Array<...>)` | `v-for`      | 列表渲染       |
| `Property.uploadable`    | `v-model`    | 双向绑定       |

## 运行时特性

### 性能

1. 框架不需要使用 **Runtime** 伴随运行，也无需通过虚拟节点定义，编译结果非常轻量。
2. 框架处理动态的节点树时，本质上是通过对新旧节点的CRUD实现。由于不需要分析diff树，刷新组件的节点树时完全采用原生DOM操作命令，所以替换树的效率极其高。
3. 框架的一切状态都是事件驱动的，只要包装器事件触发就能引起App视图更新。编写自定义的响应式封装器也相当灵活。

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](https://github.com/Rundll86/nine/issues)

## 致谢

感谢所有为本项目做出贡献的开发者和研究人员。

---

> 用意念控制未来💫
