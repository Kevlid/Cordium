export class CommandArgumentError extends Error {
    public type: "missing" | "typeMismatch" | "invalid";

    constructor(public name: string, public expected: string | null, public received: string | null, message?: string) {
        const isMissing = received === null || received === undefined;
        const isInvalid = !isMissing && expected !== null && !expected.split("|").includes(received);
        let errorMessage: string;

        if (isMissing) {
            errorMessage = `Argument "${name}" is missing, Expected type "${expected}".`;
        } else if (isInvalid) {
            errorMessage = `Argument "${name}" received value "${received}", which is not a valid type in "${expected}".`;
        } else {
            errorMessage = `Argument "${name}" expected type "${expected}", but received "${received}".`;
        }

        super(message || errorMessage);

        this.type = isMissing ? "missing" : isInvalid ? "invalid" : "typeMismatch";
    }
}
