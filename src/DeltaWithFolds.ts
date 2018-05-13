import { Fold } from "./Fold";
import { Delta } from "./Delta";

/**
 *
 */
export interface DeltaWithFolds extends Delta {
    /**
     *
     */
    folds?: Fold[];
}
