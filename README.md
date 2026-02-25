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
import { createComponent, wrap, sync, when, tree, styleSet } from "nine-9";

const counter = createComponent((props: { initial: number }) => {
    const count = wrap(props.initial);                    // 类似 Vue 的 ref
    const doubled = sync(() => count.get() * 2);           // 类似 computed

    return tree("div")
        .use(styleSet()
            .fontSize("20px")
            .padding("10px")
        )
        .append(
            tree("button")
                .on("click", () => count.set(count.get() + 1))
                .append("点击我"),
            tree("p")
                .append(count),                                    // 数据变化时自动更新
            when(count, tree("p").append("count > 0 时显示")),      // 类似 v-if
            tree("p").append(doubled)                               // 计算属性，类似 v-for
        );
});

counter({ initial: 0 }).mount("#app");
```

## 与 Vue 对比

| nine-9                       | Vue      | 说明           |
|------------------------------|----------|----------------|
| `wrap()`                     | `ref()`  | 创建响应式引用 |
| `sync()`                     | computed | 响应式计算值   |
| `when(condition, tree)`      | `v-if`   | 条件渲染       |
| `sync(() => items.map(...))` | `v-for`  | 列表渲染       |

## API

### `wrap<T>(initialData: T)`

创建响应式数据包装器。类似 Vue 的 `ref()`。

```typescript
const data = wrap({ name: "nine-9" });
data.set({ name: "updated" });
data.event.subscribe((newVal, oldVal) => {
    console.log("变化了:", oldVal, "->", newVal);
});
```

### `sync<R>(effectRenderer: () => R, dependencies?: Wrapper[])`

创建计算值，当依赖变化时自动更新。类似 Vue 的 computed 或 React 的 useMemo。返回 `Wrapper<R>`，可以用 `.get()` 读取值或订阅变化。

```typescript
const doubled = sync(() => count.get() * 2, [count]);
// 直接在树中使用
tree("p").append(doubled);

// 或订阅变化
doubled.event.subscribe((newVal, oldVal) => {
    console.log("doubled 变化了:", oldVal, "->", newVal);
});
```

### `when(condition: Wrapper<boolean> | (() => boolean), tree: TreeResult, dependencies?: Wrapper[])`

条件渲染。类似 Vue 的 `v-if`。返回 `Wrapper<TreeResult>`，可以直接放在树中。

```typescript
// 使用 Wrapper<boolean>
const isVisible = wrap(true);
when(isVisible, tree("div").append("我可见！"));

// 使用函数
when(() => count.get() > 5, tree("p").append("count > 5"), [count]);

// 直接在树中使用
tree("div").append(
    when(isVisible, tree("span").append("显示我！"))
);
```

### `createComponent<T>(renderer)`

创建组件，返回带有 `mount` 方法的渲染结果。

```typescript
const MyComponent = createComponent((props: { title: string }) => {
    return tree("div").append(props.title);
});

MyComponent({ title: "你好" }).mount("#app");
```

### `tree(tagName)`

创建 DOM 元素，支持链式调用。

```typescript
tree("div")
    .class("container")
    .id("main")
    .on("click", handler)
    .append(child1, child2);
```

### `styleSet()`

创建链式样式对象。

```typescript
tree("div")
    .use(styleSet()
        .color("red")
        .fontSize("16px")
        .display("flex")
    )
```

## License

MIT
