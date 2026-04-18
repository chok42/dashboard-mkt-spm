import { RouterProvider } from "react-router";
import { Flowbite, ThemeModeScript } from 'flowbite-react';
import customTheme from './utils/theme/custom-theme';
import { Toaster } from 'react-hot-toast';
import router from "./routes/Router";
import { AuthProvider } from "./contexts/AuthContext";

function App() {

  return (
    <>
      <ThemeModeScript />
      <Flowbite theme={{ theme: customTheme }}>
        <AuthProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <RouterProvider router={router} />
        </AuthProvider>
      </Flowbite>
    </>
  );
}

export default App;
