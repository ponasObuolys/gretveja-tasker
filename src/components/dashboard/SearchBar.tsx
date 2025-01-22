import { useSearchStore } from "@/stores/searchStore";
import { Search } from "lucide-react";

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useSearchStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('SearchBar: Search input changed:', value);
    setSearchQuery(value);
  };

  return (
    <div className="relative w-full sm:max-w-lg px-4 sm:px-0">
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Ieškoti užduočių..."
        className="w-full pl-12 pr-4 py-3 bg-[#242832] border border-gray-700 rounded-lg focus:outline-none focus:border-[#FF4B6E] text-gray-300"
      />
      <Search className="absolute left-7 sm:left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
    </div>
  );
}