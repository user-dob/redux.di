import { injectable } from "inversify";
import { Type } from "../interfaces/type";
import { ModuleProps } from "../interfaces/interfaces";

export const MODULE_METADATA_KEY = Symbol.for("ReModule/MODULE_METADATA_KEY");

export const ReModule = (props: ModuleProps) => {
    return (target: Type<any>) => {
        if (Reflect.hasOwnMetadata(MODULE_METADATA_KEY, target)) {
            throw new Error("Cannot apply @ReModule decorator multiple times.");
        }

        target = injectable()(target);
        Reflect.defineMetadata(MODULE_METADATA_KEY, props, target);
    };
};
