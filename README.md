# nine-9

一个轻量、高性能、类型安全的 Vanilla DOM 响应式 UI 框架。

融合了 Vue 模板指令和 React Hooks 的优点，取两者之长。

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
import { createComponent, wrap, sync, when, tree, styleSet, $ } from "nine-9";

const counter = createComponent({
    initial: {
        validate: Number.isInteger, // 参数验证器
        transform: Number,          // 参数转换器
        required: false,            // 是否必填
        shadow: 0                   // 默认值
    }
}, (props) => {
    const count = wrap(props.initial);                     // 类似 Vue 的 ref
    const doubled = sync(() => count.get() * 2);           // 类似 computed

    return tree("div")
        .use(
            styleSet()
                .fontSize("20px")
                .padding("10px")
        )
        .append(
            tree("button")
                .on("click", () => count.set(count.get() + 1))
                .textContent("点击我"),
            tree("p").append($(count)),                            // 数据变化时自动更新
            when(count, tree("p").textContent("count > 0 时显示")), // 条件渲染：v-if
            tree("p").append($(doubled))                           // 列表渲染：v-for
        );
});

counter({ initial: 0 }).mount("#app");
```

## 与 Vue 对比

| nine-9                       | Vue          | 说明           |
|------------------------------|--------------|----------------|
| `wrap()`                     | `ref()`      | 创建响应式引用 |
| `sync()`                     | `computed()` | 响应式计算值   |
| `when(condition, tree)`      | `v-if`       | 条件渲染       |
| `sync(() => items.map(...))` | `v-for`      | 列表渲染       |

## API
