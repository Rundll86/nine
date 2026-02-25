import { $, createComponent, tree, wrap } from "@";

export default createComponent({
    props: {
        initialValue: {
            transform: Number,
            validate: Number.isInteger,
            shadow: 0,
            // required: false
        }
    }
}, (props) => {
    const currentValue = wrap(props.initialValue);
    return tree("div")
        .append(
            "当前数值：", $(currentValue),
            tree("button")
                .textContent("点击加一")
                .on("click", () => currentValue.set(currentValue.get() + 1)),
            tree("button")
                .textContent("点击减一")
                .on("click", () => currentValue.set(currentValue.get() - 1))
        );
});