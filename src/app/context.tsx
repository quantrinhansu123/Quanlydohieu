import GlobalHooks from "@/components/GlobalHooks";
import { FirebaseClientProvider } from "@/firebase";
import { AppThemeProvider } from "@/providers/AppThemeProvider";
import React from "react";

const AppContext = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <FirebaseClientProvider>
        <AppThemeProvider>
          {children}
          <GlobalHooks />
        </AppThemeProvider>
      </FirebaseClientProvider>
    </>
  );
};

export default AppContext;
