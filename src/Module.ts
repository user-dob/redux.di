import { Container } from "inversify";
import { Type, isType } from "./interfaces/type";
import { ModuleProps, Provider, IReducerService, ISagaService } from "./interfaces/interfaces";
import { IModuleVisitor } from "./visitors/IModuleVisitor";
import { MODULE_METADATA_KEY } from "./annotation/ReModule";

export const LINK_ON_MODULE_KEY = Symbol.for("ReModule/LINK_ON_MODULE_KEY");

export class Module {
    private props: ModuleProps;
    private container: Container;
    private target: Type<any>;

    public static getModule = (target: Type<any>): Module | null => {
        return Reflect.getMetadata(LINK_ON_MODULE_KEY, target) as Module;
    }

    public static getProviderByModule = (target: Type<any>, provider: Type<any>): any => {
        const module = Module.getModule(target);
        if (!module) {
            throw new Error(`${target.name} is not a module.`); 
        }
    
        return module.getProvider(provider);
    }

    public constructor(target: Type<any>) {
        this.target = target;
        this.props = Reflect.getMetadata(MODULE_METADATA_KEY, target);
        if (!this.props) {
            throw new Error(`Missing required @ReModule annotation in: ${target.name}.`); 
        }
        Reflect.defineMetadata(LINK_ON_MODULE_KEY, this, target);

        this.container = new Container({defaultScope: "Singleton"});
    }

    public resolve(): Type<any> {
        const providers = [
            this.target,
            ...this.providers,
            ...this.exports,
            ...this.reducers,
            ...this.sagas
        ];

        providers.forEach(provider => this.setProvider(provider));

        return this.container.resolve(this.target);
    }

    public getProvider(provider: Type<any>): any {
        return this.container.get(provider);
    }

    public setProvider(provider: Provider): any {
        if (isType(provider)) {
            provider = { provide: provider, useClass: provider };
        }        

        const { provide } = provider;

        if (this.container.isBound(provide)) {
            return;
        }    

        if ("useClass" in provider) {
            return this.container.bind(provide).to(provider.useClass);
        }

        if ("useValue" in provider) {
            return this.container.bind(provide).toConstantValue(provider.useValue);
        }

        if ("useContainer" in provider) {
            return provider.useContainer(this.container);
        }
    }

    public accept(visitor: IModuleVisitor): void {
        visitor.visit(this);
    }

    public get name(): string {
        return this.props.name;
    }

    public get reducers(): Type<IReducerService>[] {
        return this.props.reducers || [];
    }

    public get sagas(): Type<ISagaService>[] {
        return this.props.sagas || [];
    }

    public get imports(): Type<any>[] {
        return this.props.imports || [];
    }

    public get exports(): Type<any>[] {
        return this.props.exports || [];
    }

    public get providers(): Provider[] {
        return this.props.providers || [];
    } 

    public get components(): Type<any>[] {
        return this.props.components || [];
    }  

    public get bootstrap(): any {
        return this.props.bootstrap || null;
    }
}
