import { useSearchStore } from "@/stores/searchStore";
import { Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useSearchStore();
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  const saveRecentSearch = (search: string) => {
    if (!search.trim()) return;
    
    const updatedSearches = [
      search,
      ...recentSearches.filter(s => s !== search)
    ].slice(0, 5);
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('SearchBar: Search input changed:', value);
    setSearchQuery(value);
  };

  const handleClear = () => {
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    } else if (e.key === 'Enter' && searchQuery) {
      saveRecentSearch(searchQuery);
    }
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    saveRecentSearch(search);
  };

  return (
    <div className="relative w-full sm:max-w-lg">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Ieškoti užduočių..."
          autoComplete="off"
          className={cn(
            "w-full h-[44px] pl-12 pr-10 py-3 bg-[#2A2E39]",
            "border border-gray-700 rounded-lg",
            "focus:outline-none focus:border-[#FF4B6E] focus:ring-1 focus:ring-[#FF4B6E]",
            "text-gray-200 placeholder:text-gray-400",
            "transition-all duration-200 ease-in-out",
            "shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]",
            "hover:bg-[#2D3241]",
            "active:scale-[0.98]"
          )}
        />
        <Search 
          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 
                    pointer-events-none transition-colors" 
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 
                     rounded-full hover:bg-gray-700/50 transition-colors"
            aria-label="Išvalyti paiešką"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Recent searches dropdown */}
      {isFocused && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-[#2A2E39] 
                      border border-gray-700 rounded-lg shadow-lg z-50">
          <p className="px-4 py-1 text-sm text-gray-400">Pastarieji ieškojimai:</p>
          {recentSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => handleRecentSearchClick(search)}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 
                       transition-colors focus:outline-none focus:bg-gray-700/50"
            >
              <Search className="inline-block h-4 w-4 mr-2 text-gray-400" />
              {search}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;