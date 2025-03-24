export function getDisplayRole(serverRole: string): string {
    const lower = serverRole.toLowerCase();
    if (lower === "user") return "INVESTOR";
    if (lower === "assistant") return "AI AGENT";
    return serverRole;
}  