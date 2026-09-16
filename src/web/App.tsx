import { useEffect, useState } from "react";

type HealthState = "checking" | "ok" | "error";

function App() {
  const [health, setHealth] = useState<HealthState>("checking");

  useEffect(() => {
    fetch("/api/health")
      .then((response) => {
        if (!response.ok) throw new Error("Health check failed");
        setHealth("ok");
      })
      .catch(() => setHealth("error"));
  }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Railway certification workspace</p>
          <h1>Certified Loco</h1>
        </div>
        <span className={`status status-${health}`}>
          {health === "checking" && "Checking API"}
          {health === "ok" && "API connected"}
          {health === "error" && "API unavailable"}
        </span>
      </header>

      <section className="intro-card">
        <p className="eyebrow">First release</p>
        <h2>Certification assessments with evidence you can review.</h2>
        <p>
          Start with a confirmed certificate, compare historical tests with
          the published regulatory dataset, and keep the source behind every
          result.
        </p>
        <button type="button" disabled>
          New assessment — coming next
        </button>
      </section>

      <section className="workspace-grid" aria-label="Application areas">
        <article>
          <span className="card-number">01</span>
          <h3>Assessments</h3>
          <p>Compare a part's historical programme with current requirements.</p>
        </article>
        <article>
          <span className="card-number">02</span>
          <h3>Knowledge catalogue</h3>
          <p>Maintain parts, tests, standards, regulations and certificates.</p>
        </article>
        <article>
          <span className="card-number">03</span>
          <h3>Review and publish</h3>
          <p>Approve regulatory changes before users can rely on them.</p>
        </article>
      </section>
    </main>
  );
}

export default App;
