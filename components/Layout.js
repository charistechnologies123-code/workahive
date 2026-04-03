import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">{children}</main>
      <footer className="footer">
        <div className="footer-inner">© {new Date().getFullYear()} WorkaHive </div>
      </footer>
    </div>
  );
}