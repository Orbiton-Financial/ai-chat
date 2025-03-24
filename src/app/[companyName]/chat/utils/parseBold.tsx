export function parseBold(str: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index));
        }
        parts.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) {
        parts.push(str.slice(lastIndex));
    }
    return parts;
}