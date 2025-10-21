"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "bg-[#1a1a1a] text-white border-none shadow-lg rounded-lg px-4 py-3",
          title: "text-base font-semibold",
          description: "text-sm text-gray-300",
          actionButton:
            "bg-white text-black px-3 py-1 rounded-md hover:bg-gray-100",
          cancelButton: "text-white hover:text-gray-400",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
