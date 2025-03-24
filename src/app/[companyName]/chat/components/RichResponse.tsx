import { RichContent } from "../utils/isRichContent";
import Image from "next/image";

export function RichResponse({ data }: { data: RichContent }) {
    return (
        <div className="border p-2 rounded-md bg-white text-black">
            <h3 className="font-bold">{data.title}</h3>
            {data.subtitle && <p>{data.subtitle}</p>}
            {data.imageUrl && (
            <Image
                src={data.imageUrl}
                alt={data.title}
                width={400}
                height={300}
                className="my-2"
            />
            )}
            {data.link && (
            <a
                href={data.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
            >
                View Document
            </a>
            )}
        </div>
    );
}