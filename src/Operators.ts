export enum CompOperators {
    GT,
    LT,
    EQ,
    IS
}

export enum LogicalOperators {
    AND, OR
}

export class CompOperator {
    /**
     * Get the Compare Operators from a String
     * @param name, String of one of 'GT', 'LT', 'EQ', or 'IS'.
     */
    public static getCompOperators(name: string): CompOperators {
        switch (name) {
            case "GT":
                return CompOperators.GT;
            case "LT":
                return CompOperators.LT;
            case "EQ":
                return CompOperators.EQ;
            case "IS":
                return CompOperators.IS;
        }
    }

    /**
     * Return the compare function of a logic.
     * @param comp
     */
    public static getCompareFunction(comp: CompOperators): (x: any, y: any) => boolean {
        switch (comp) {
            case CompOperators.EQ:
                return (x: any, y: any) => x === y;
            case CompOperators.GT:
                return (x: any, y: any) => x > y;
            case CompOperators.LT:
                return (x: any, y: any) => x < y;
            case CompOperators.IS:
                return (x: any, y: any) => {
                    let value: string = x as string;
                    let match: string = y as string;
                    if (match === "*") {
                        return true;
                    }
                    if (match.startsWith("*") && match.endsWith("*")) {
                        let matchStr = match.substring(1, match.length - 1);
                        return value.indexOf(matchStr) !== -1;
                    } else if (match.startsWith("*")) {
                        return value.endsWith(match.substring(1));
                    } else if (match.endsWith("*")) {
                        return value.startsWith(match.substring(0, match.length - 1));
                    } else {
                        return value === match;
                    }
                };
        }
    }
}

