import { matchFlag, WRAPPER } from "@/constants";
import { Wrapper } from "../wrapper";

export function useUpdate<T>(data: T | Wrapper<T>, update: (data: T) => void) {
    if (matchFlag<T, typeof WRAPPER>(data, WRAPPER)) {
        data.event.subcribe(update);
    } else {
        update(data);
    }
}