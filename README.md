# nine-9

一个轻量、高性能、类型安全的 Vanilla DOM 响应式 UI 框架。

本项目的宗旨是摒弃 Vue 不够灵活的**模板语法**和 React 混乱耦合的**状态管理**，取两者之长。
运行时轻量，高性能，纯 Vanilla DOM 100% 兼容其他框架，打包后🉑以用于 **UserScript**。

## 特性

- **响应式** - 数据变化时自动更新 UI
- **差量更新** - 只更新变化的 DOM，速度更快
- **类型安全** - 完整的 TypeScript 支持，IntelliSense 支持完善
- **轻量级** - 无依赖，打包后体积小巧
- **链式 API** - 流畅的 DOM 操作
- **灵活渲染器** - 熟悉的 `条件渲染`、`列表渲染` 等模式
- **模板表达式** - 表达式只要🉑响应，就🉑以放在模板任意位置

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
} from "nine";

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
2. 处理动态节点树时，本质上是通过对新旧节点的CRUD实现。由于不需要分析diff树，重建组件的节点树是完全局部替换的，采用原生DOM操作命令，更新速度极其快。
3. 响应式包装器的一切状态变化都是事件驱动的，只要包装器事件触发就能连锁引起App视图更新。
4. 模块解耦，**nine-9** 的初衷是链式调用生成原生DOM，`树`/`组件`/`响应式` 三大模块已充分解耦，随取随用。

## 贡献指南

欢迎提交Issue和Pull Request！

## 许🉑证

本项目采用 MIT 许🉑证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](https://github.com/Rundll86/nine/issues)

## 致谢

感谢所有为本项目做出贡献的开发者和研究人员。

---

> 用意念控制未来💫
