import "../styles/globals.css";
import Layout from "../components/Layout";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }) {
  const page = (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "10px",
            background: "#1f2937",
            color: "#fff",
          },
        }}
      />
      <Component {...pageProps} />
    </>
  );

  if (Component.disableLayout) {
    return page;
  }

  return (
    <AuthProvider>
      <Layout>
        {page}
      </Layout>
    </AuthProvider>
  );
}
