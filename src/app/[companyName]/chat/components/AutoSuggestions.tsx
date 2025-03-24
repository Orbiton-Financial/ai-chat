import { Button } from "@/components/ui/button";

export function AutoSuggestions({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}) {
  return (
    <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
      <p className="text-sm text-gray-500 mb-2">You might also ask about:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-600 hover:bg-gray-100"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}