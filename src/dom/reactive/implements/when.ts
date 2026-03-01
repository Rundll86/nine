import { SourceTree } from "@/dom/component";
import { matchFlag, WRAPPER } from "@/constants/flags";
import { Wrapper } from "..";
import { sync } from "./sync";

export function when(
    condition: boolean | Wrapper<boolean> | (() => boolean),
    tree: () => SourceTree,
    dependencies: unknown[] = [],
    elseTree: () => SourceTree = () => null
) {
    return sync(() => {
        let result: boolean;
        if (typeof condition === "function") {
            result = condition();
        } else if (typeof condition === "boolean") {
            result = condition;
        } else {
            result = condition.get();
        }
        return [result ? tree() : elseTree()];
    }, [...dependencies, ...(matchFlag(condition, WRAPPER) ? [condition] : [])]);
}