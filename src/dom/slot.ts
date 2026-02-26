import { SourceTree } from "./component";
import { isWrapper, wrap, Wrapper } from "./reactive";

export type RawSlotInput = SourceTree | (() => SourceTree);
export type SlotInput = RawSlotInput | Wrapper<RawSlotInput>;
export type SlotOutput = Wrapper<SourceTree>;

export function pipeExtract(input: SlotInput): SlotOutput {
    if (typeof input === "function") {
        return wrap(input());
    } else if (isWrapper<RawSlotInput>(input)) {
        return pipeExtract(input);
    } else return wrap(input);
}