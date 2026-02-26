import { $, createComponent, sync, tree, TreeResult } from "@";

function isNumeric(value: unknown) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'number') return isFinite(value);
    if (typeof value === 'string') return value.trim() !== '' && !isNaN(Number(value));
    return false;
}
export default createComponent({
    props: {
        v1: {
            transform: Number,
            shadow: 0,
            validate: isNumeric
        },
        v2: {
            transform: Number,
            shadow: 0,
            validate: isNumeric
        }
    }
}, (props) =>
    tree("div").append(
        $(props.v1), "+", $(props.v2), "=", sync<TreeResult>(() => props.v1.get() + props.v2.get(), [props.v1, props.v2]))
);