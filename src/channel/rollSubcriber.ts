import { BaseSubcriber } from "./baseSubcriber";

export class RollSubcriber extends BaseSubcriber<null[]> {
    constructor(executor: () => boolean) {
        super();
        const roll = () => {
            if (executor()) this.emit();
            requestAnimationFrame(roll);
        };
        requestAnimationFrame(roll);
    }
}