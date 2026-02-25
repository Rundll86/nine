import { TreeResult } from "./component";
import { isWrapper, wrap, Wrapper } from "./reactive";

export type RawSlotInput = TreeResult | (() => TreeResult);
export type SlotInput = RawSlotInput | Wrapper<RawSlotInput>;
export type SlotOutput = Wrapper<TreeResult>;

export function pipeExtract(input: SlotInput): SlotOutput {
    if (typeof input === "function") {
        return wrap(input());
    } else if (isWrapper<RawSlotInput>(input)) {
        return pipeExtract(input);
    } else return wrap(input);
}