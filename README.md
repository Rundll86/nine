# nine-9

一个轻量、高性能、类型安全的 Vanilla DOM 响应式 UI 框架。

融合了 Vue 模板指令和 React Hooks 的优点，取两者之长。
同时运行及其轻量，甚至打包后可以用于 XXXMonkey UserScript。

## 特性

- **响应式** - 数据变化时自动更新 UI
- **差量更新** - 只更新变化的 DOM，速度更快
- **类型安全** - 完整的 TypeScript 支持，类型推断优秀
- **轻量级** - 无依赖，体积小巧
- **链式 API** - 流畅的 DOM 操作
- **Vue 风格指令** - 熟悉的 v-if、v-for 模式
- **JSX 风格表达式** - 响应式表达式可以放在模板任意位置
- **数据同步系统** - 使用更优的语法实现数据响应式

## 安装

```bash
npm install nine-9
```

## 示例用法

```typescript
// Counter.ts
import { $, createComponent, tree, sync, styleSet, createArray, when } from "@";

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
    }
}, (props) => {
    const doubled = sync(() => props.value.get() * 2, [props.value]); //computed
    return tree("div")
        .use(styleSet().fontSize("20px").padding("10px"))
        .append(
            "敲木鱼", tree("br"),
            tree("button")
                .on("click", () => props.value.set(props.value.get() + 1)) //参数uploadable，赋值会实时同步到上游
                .textContent("点击加一"),
            tree("button")
                .on("click", () => props.value.set(props.value.get() - 1))
                .textContent("点击减一"),
            tree("br"),
            "当前值：", $(props.value), //引用响应式的值，类似模板语法{{ count }}
            "双倍值：", $(doubled),
            $(sync( //只要是能渲染的东西，就能进行响应式引用
                () => createArray(
                    doubled.get(),
                    () => tree("div").textContent("你点了一下")
                ),
                [doubled]
            )), //列表渲染v-for
            when(
                () => props.value.get() > 10,
                () => tree("p").textContent("count > 10 时显示"),
                [props.value]
            ), //条件渲染v-if
        );
});
```

## 与 Vue 对比

| nine-9                       | Vue          | 说明           |
|------------------------------|--------------|----------------|
| `wrap()`                     | `ref()`      | 创建响应式引用 |
| `sync()`                     | `computed()` | 响应式计算值   |
| `when(condition, tree)`      | `v-if`       | 条件渲染       |
| `sync(() => items.map(...))` | `v-for`      | 列表渲染       |
| `Property.uploadable`        | `v-model`    | 双向绑定       |

## 运行时特性

### 性能

1. 由于框架不需要使用 **Runtime** 伴随运行，也无需通过虚拟节点重新生成整个节点树（对节点树的更改完全基于原生DOM操作命令），因此应用的运行性能相当高，甚至可以媲美Vanilla.js的速度了。
2. 框架处理动态的节点树时，本质上是通过对新旧节点的CRUD实现。但不同于 Vue 的是，**nine-9** 不需要分析diff树，用列表渲染（`sync` ← `v-for`）举例，框架使用 `TreeContext` 接口来描述一个XML节点，**HTML元素、字符串、数字、各类空值（null、undefined）、组件渲染结果**都可以被归一化为一个 `TreeContext` 接口，而这个接口必定会用于封装一个非空的XML节点，当使用 `append` 方法添加一个响应式数组时，`TreeContext` 会首先在当前封装的节点最后添加一个注释节点用于当做锚点，旧列表中渲染出的节点将会被删除，新列表中的节点插入到锚点的后面。

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
