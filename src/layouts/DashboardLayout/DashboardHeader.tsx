import { SearchBar } from "./components/SearchBar";
import { HeaderActions } from "./components/HeaderActions";

export function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 lg:p-6 gap-4">
      <SearchBar />
      <HeaderActions />
    </div>
  );
}

export default DashboardHeader;