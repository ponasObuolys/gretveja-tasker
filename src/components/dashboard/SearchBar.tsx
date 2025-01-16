import { useSearchStore } from "@/stores/searchStore";

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useSearchStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('SearchBar: Search input changed:', value);
    setSearchQuery(value);
  };

  return (
    <div className="relative w-full sm:max-w-lg">
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Ieškoti užduočių..."
        className="w-full pl-10 pr-4 py-2 bg-[#242832] border border-gray-700 rounded-lg focus:outline-none focus:border-[#FF4B6E] text-gray-300"
      />
      <svg
        className="absolute left-3 top-2.5 h-5 w-5 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
}