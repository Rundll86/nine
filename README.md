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

## 安装

```bash
npm install nine-9
```

## 快速开始

```typescript
import { $, createArray, createComponent, styleSet, sync, tree, when, wrap } from "./nine";

const Counter = createComponent({ //创建组件
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
            sync(() => createArray(doubled.get(), () => tree("div").textContent("你点了一下")), [doubled]), //列表渲染v-for
            when(() => count.get() > 10, () => tree("p").textContent("count > 10 时显示"), [count]), //条件渲染v-if
        );
});

Counter({ initial: 0 }).mount("body");
```

## 与 Vue 对比

| nine-9                       | Vue          | 说明           |
|------------------------------|--------------|----------------|
| `wrap()`                     | `ref()`      | 创建响应式引用 |
| `sync()`                     | `computed()` | 响应式计算值   |
| `when(condition, tree)`      | `v-if`       | 条件渲染       |
| `sync(() => items.map(...))` | `v-for`      | 列表渲染       |

## 运行时特性

### 性能

由于框架不需要使用 **Runtime** 伴随运行，也无需通过虚拟节点重新生成整个节点树（对节点树的更改完全基于原生DOM操作命令），因此应用的运行性能相当高，甚至可以媲美Vanilla.js的速度了。

### 使用

框架处理动态的节点树时，本质上是通过对新旧节点的增删改查实现。但不同于 Vue 的是，**nine-9** 不需要分析diff树，用列表渲染（`sync` ← `v-for`）举例，框架使用 `TreeContext` 接口来描述一个XML节点，**HTML元素、字符串、数字、各类空值（null、undefined）、组件渲染结果**都可以被归一化为一个 `TreeContext` 接口，而这个接口必定会用于封装一个非空的XML节点，当使用 `append` 方法添加一个响应式数组时，`TreeContext` 会首先在当前封装的节点最后添加一个注释节点用于当做锚点，旧列表中渲染出的节点将会被删除，新列表中的节点插入到锚点的后面。
