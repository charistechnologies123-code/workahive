import Head from "next/head";

export default function MaintenancePage() {
  return (
    <>
      <Head>
        <title>WorkaHive | Maintenance</title>
        <meta
          name="description"
          content="WorkaHive is temporarily unavailable while we complete a major update."
        />
      </Head>

      <main className="maintenance-page">
        <section className="maintenance-card">
          <img
            src="/workahive-logo.png"
            alt="WorkaHive"
            className="maintenance-logo"
          />

          <span className="maintenance-badge">Temporary Maintenance</span>

          <h1 className="maintenance-title">We&apos;re rolling out a major update.</h1>

          <p className="maintenance-copy">
            WorkaHive is temporarily offline while we improve the platform.
            Please check back shortly.
          </p>

          <div className="maintenance-meta">
            <div className="maintenance-meta-item">
              <span className="maintenance-meta-label">Status</span>
              <strong>In progress</strong>
            </div>
            <div className="maintenance-meta-item">
              <span className="maintenance-meta-label">Support</span>
              <div className="maintenance-support-links">
                <a href="mailto:charistechnologies123@gmail.com">
                  charistechnologies123@gmail.com
                </a>
                <a
                  href="https://wa.me/2349130276015?text=Hello%20WorkaHive%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp Support
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .maintenance-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(circle at top, rgba(37, 99, 235, 0.18), transparent 40%),
            linear-gradient(160deg, #eff6ff 0%, #f8fafc 55%, #e2e8f0 100%);
        }

        .maintenance-card {
          width: min(680px, 100%);
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 28px;
          padding: 40px 28px;
          text-align: center;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
        }

        .maintenance-logo {
          width: min(220px, 100%);
          height: auto;
          margin-bottom: 20px;
        }

        .maintenance-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .maintenance-title {
          margin: 16px 0 12px;
          font-size: clamp(2rem, 5vw, 3.4rem);
          line-height: 1.05;
          letter-spacing: -0.04em;
          color: #111827;
        }

        .maintenance-copy {
          max-width: 520px;
          margin: 0 auto;
          color: #6b7280;
          font-size: 1.05rem;
          line-height: 1.7;
        }

        .maintenance-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 28px;
          text-align: left;
        }

        .maintenance-meta-item {
          padding: 16px 18px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid rgba(226, 232, 240, 0.9);
        }

        .maintenance-meta-label {
          display: block;
          margin-bottom: 8px;
          color: #6b7280;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .maintenance-meta-item strong {
          color: #111827;
        }

        .maintenance-meta-item a {
          color: #2563eb;
          font-weight: 700;
        }

        .maintenance-support-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        @media (max-width: 640px) {
          .maintenance-card {
            padding: 32px 20px;
            border-radius: 22px;
          }

          .maintenance-meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

MaintenancePage.disableLayout = true;
