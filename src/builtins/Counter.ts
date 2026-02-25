import { $, createComponent, render, sync, tree, TreeResult, wrap, Wrapper } from "@";

export default createComponent({
    props: {
        initialValue: {
            transform: Number,
            validate: Number.isInteger,
            shadow: 0,
            required: false
        }
    }
}, (props) => {
    const currentValue = wrap(props.initialValue);
    return tree("div")
        .append(
            $(currentValue)
        );
});