export interface RichContent {
    type: "rich";
    title: string;
    subtitle?: string;
    imageUrl?: string;
    link?: string;
  }

export function isRichContent(content: unknown): content is RichContent {
    return (
      typeof content === "object" &&
      content !== null &&
      (content as RichContent).type === "rich"
    );
}