import { $, tree, wrap, examples, sync } from "@";

const value = wrap(0);
value.event.subcribe((e) => console.log("下游更新：", e));

examples.Selector({ value }, {
    title: (text) => tree("span").append("当前选项的label：", $(sync(() => `<${text.get()}>`, [text])))
})
    .on("select", e => console.log("当前选项：", e))
    .on("toggleState", e => console.log("当前是否开关：", e))
    .mount("#app");

examples.Counter().mount("#app");
examples.ObjectWatcher().mount("#app");
