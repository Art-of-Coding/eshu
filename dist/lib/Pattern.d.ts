export interface IParams {
    [x: string]: any;
}
export declare function clean(pattern: string | string[]): string | string[];
export declare function cleanSingle(pattern: string): string;
export declare function cleanMulti(patterns: string[]): string[];
export declare function matches(pattern: string, topic: string): boolean;
export declare function extract(pattern: string, topic: string): IParams;
