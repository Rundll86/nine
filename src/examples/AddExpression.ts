import { $, createComponent, sync, tree, SourceTree } from "@";

function isNumeric(value: unknown) {
    if (value === null || value === undefined) return false;
    if (typeof value === "number") return isFinite(value);
    if (typeof value === "string") return value.trim() !== "" && !isNaN(Number(value));
    return false;
}
export default createComponent({
    props: {
        v1: {
            transform: Number,
            shadow: 0,
            validate: isNumeric,
            required: true,
            uploadable: true,
            downloadable: true
        },
        v2: {
            transform: Number,
            shadow: 0,
            validate: isNumeric,
            required: true,
            uploadable: true,
            downloadable: true
        }
    }
}, (props) =>
    tree("div").append(
        $(props.v1), "+", $(props.v2), "=",
        sync<SourceTree>(() => props.v1.get() + props.v2.get(), [props.v1, props.v2]),
        tree("button")
            .textContent("下游 v1 -1")
            .on("click", () => props.v1.set(props.v1.get() - 1)),
        tree("button")
            .textContent("下游 v2 -1")
            .on("click", () => props.v2.set(props.v2.get() - 1)),
    ),
);