import React from "react";

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1D24]">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">GRETVĖJA TASKER</h2>
        <p className="text-gray-400">Kraunama...</p>
      </div>
    </div>
  );
};