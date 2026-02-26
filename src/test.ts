import { wrap } from "./dom";
import examples from "./examples";

const value = wrap(0);

examples.Selector({ value })
    .on("select", e => console.log("当前选项：", e))
    .on("toggleState", e => console.log("当前是否开关：", e))
    .mount("#app");
