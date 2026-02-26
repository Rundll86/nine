import { $, createComponent, tree, wrap } from "@";
import AddExpression from "./AddExpression";

export default createComponent({}, () => {
    const v1 = wrap(10);
    const v2 = wrap(20);
    return tree("div")
        .append(
            "v1:", $(v1), "v2:", $(v2),
            AddExpression({ v1, v2 }),
            tree("button")
                .textContent("上游 v1 +1")
                .on("click", () => v1.set(v1.get() + 1)),
            tree("button")
                .textContent("上游 v2 +1")
                .on("click", () => v2.set(v2.get() + 1)),
        );
});