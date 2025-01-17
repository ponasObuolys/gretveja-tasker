import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LinkIcon, X } from "lucide-react";

interface LinkInputSectionProps {
  link: string;
  links: string[];
  onLinkChange: (value: string) => void;
  onLinksChange: (links: string[]) => void;
}

export function LinkInputSection({ link, links, onLinkChange, onLinksChange }: LinkInputSectionProps) {
  const handleAddLink = () => {
    if (link && !links.includes(link)) {
      onLinksChange([...links, link]);
      onLinkChange("");
    }
  };

  const removeLink = (index: number) => {
    onLinksChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1">
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Įvesti nuorodą..."
          value={link}
          onChange={(e) => onLinkChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-secondary rounded-md"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAddLink}
          disabled={!link}
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
      </div>
      {links.length > 0 && (
        <ScrollArea className="h-[100px] rounded-md border p-2 mt-2">
          <div className="space-y-2">
            {links.map((link, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-secondary/50 p-2 rounded"
              >
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline truncate"
                  >
                    {link}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLink(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}