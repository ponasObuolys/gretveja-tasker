import { ReactNode } from "react";

interface AuthContainerProps {
  children: ReactNode;
}

export const AuthContainer = ({ children }: AuthContainerProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1D24]">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#242832] rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            GRETVĖJA TASKER
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Prisijunkite prie savo paskyros
          </p>
        </div>
        {children}
      </div>
    </div>
  );
};