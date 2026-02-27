import { SourceTree } from "@/dom/component";
import { matchFlag, WRAPPER } from "@/constants/flags";
import { Wrapper } from "..";
import { sync } from "./sync";

export function when(condition: Wrapper<boolean> | (() => boolean), tree: () => SourceTree, dependencies: unknown[] = []) {
    return sync(() => {
        let result: boolean;
        if (typeof condition === "function") {
            result = condition();
        } else {
            result = condition.get();
        }
        return [result ? tree() : null];
    }, [...dependencies, ...(matchFlag(condition, WRAPPER) ? [condition] : [])]);
}