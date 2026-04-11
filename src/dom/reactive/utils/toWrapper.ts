import { matchFlag, WRAPPER } from "@/constants";
import { wrap, Wrapper } from "../wrapper";

export function toWrapper<T>(data: T | Wrapper<T>): Wrapper<T> {
    if (matchFlag<T, typeof WRAPPER>(data, WRAPPER)) {
        return data;
    } else {
        return wrap(data);
    }
}