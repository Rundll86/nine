# nine-9

一个轻量、高性能、类型安全的 Vanilla DOM 响应式 UI 框架。

融合了 Vue 模板指令和 React Hooks 的优点，取两者之长。同时运行及其轻量，甚至打包后可以用于 XXXMonkey UserScript。

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
