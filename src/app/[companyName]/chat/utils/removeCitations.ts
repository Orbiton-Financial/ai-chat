export function removeCitations(str: string): string {
    return str.replace(/【[^】]+】/g, "");
}