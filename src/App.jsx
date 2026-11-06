// App.jsx - Application shell: navigation, verification flow and shared state
import { useState } from "react";
import Header from "./components/Header";
import LiveFeed from "./components/LiveFeed";
import SourceTraceModal from "./components/SourceTraceModal";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import NewsVerifier from "./components/NewsVerifier";
import TrustedWiresGrid from "./components/TrustedWiresGrid";
import ConnectionBanner from "./components/ConnectionBanner";
import NewsFeedPanel from "./components/NewsFeedPanel";
import { useTheme } from "./hooks/useTheme";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useNewsFeed } from "./hooks/useNewsFeed";
import { useTrackedThreads } from "./hooks/useTrackedThreads";
import { verifyClaim } from "./services/verificationService";
import "./App.css";

export default function App() {
  const { themeMode, effectiveTheme, setThemeMode } = useTheme();
  const { threads, userThreads, upsertThread, findPreviousCheck, clearUserThreads } = useTrackedThreads();
  const { online, justReconnected } = useOnlineStatus();

  const [activeTab, setActiveTab] = useState("verifier"); // 'verifier' | 'feed' | 'analytics' | 'sources'
  const [selectedPost, setSelectedPost] = useState(null);

  // Verification state (claim and country are shared by the studio and the newsfeed)
  const [claim, setClaim] = useState("");
  const [country, setCountry] = useState("Any");
  const [isChecking, setIsChecking] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [notice, setNotice] = useState(null);
  const [fromHistory, setFromHistory] = useState(false);

  const newsFeed = useNewsFeed(country, online);

  // Feed filters live here so they survive tab switches
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [selectedSources, setSelectedSources] = useState(["ALL"]);
  const [selectedRegion, setSelectedRegion] = useState("ALL");

  const runCheck = async (claim, country) => {
    setIsChecking(true);
    setNotice(null);
    try {
      const { report, notice: serviceNotice } = await verifyClaim(claim, country, {
        online,
        savedHeadlines: newsFeed.savedHeadlines,
      });
      if (report) {
        upsertThread(report);
        setCurrentReport(report);
        setFromHistory(false);
        setNotice(serviceNotice);
      }
    } catch (err) {
      console.error("Claim verification error:", err);
      setNotice("Something went wrong while checking this claim. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  // Re-use an earlier result for the same claim instead of checking it again,
  // unless it was only pattern-checked (e.g. offline) and live sources are now available.
  const handleVerify = (claim, country) => {
    const previous = findPreviousCheck(claim, country);
    if (previous && !(online && (previous.checkedOffline || previous.method === "heuristic"))) {
      handleOpenHistory(previous);
      return;
    }
    runCheck(claim, country);
  };

  // "Check" on a headline: put it in the studio and check it straight away.
  const handleCheckHeadline = (title) => {
    setClaim(title);
    handleVerify(title, country);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRecheck = (report) => runCheck(report.content, report.country || "Any");

  const handleOpenHistory = (report) => {
    setCurrentReport(report);
    setFromHistory(true);
    setNotice(null);
  };

  return (
    <div className="app-layout">
      <Header
        postCount={threads.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        effectiveTheme={effectiveTheme}
      />

      <ConnectionBanner online={online} justReconnected={justReconnected} />

      <main className="main-content-container">
        {activeTab === "verifier" && (
          <div className="studio-layout">
            <NewsVerifier
              claim={claim}
              setClaim={setClaim}
              country={country}
              setCountry={setCountry}
              savedHeadlineCount={newsFeed.savedHeadlines.length}
              onVerify={handleVerify}
              onRecheck={handleRecheck}
              isChecking={isChecking}
              online={online}
              report={currentReport}
              notice={notice}
              fromHistory={fromHistory}
              history={userThreads}
              onOpenHistory={handleOpenHistory}
              onClearHistory={clearUserThreads}
              onOpenFullReport={setSelectedPost}
            />
            <NewsFeedPanel
              items={newsFeed.items}
              fetchedAt={newsFeed.fetchedAt}
              savedCount={newsFeed.savedHeadlines.length}
              loading={newsFeed.loading}
              error={newsFeed.error}
              online={online}
              country={country}
              onRefresh={newsFeed.refresh}
              onCheck={handleCheckHeadline}
              isChecking={isChecking}
            />
          </div>
        )}

        {activeTab === "feed" && (
          <LiveFeed
            posts={threads}
            onSelectPost={setSelectedPost}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            selectedSources={selectedSources}
            setSelectedSources={setSelectedSources}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
          />
        )}

        {activeTab === "analytics" && <AnalyticsDashboard posts={threads} />}

        {activeTab === "sources" && (
          <div className="panel-card full-width" style={{ marginTop: "1.5rem" }}>
            <h3 className="section-title">Verified News Wire Outlets & Fact-Check Registries</h3>
            <p className="section-desc">
              These international wires and African fact-checking institutions are the reference set VerifiNews points
              you to when checking a claim.
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <TrustedWiresGrid />
            </div>
          </div>
        )}
      </main>

      {selectedPost && <SourceTraceModal post={selectedPost} onClose={() => setSelectedPost(null)} />}

      <footer className="app-footer">
        <p>VerifiNews • Check claims before you share them. Results are guidance, not a substitute for professional fact-checking.</p>
      </footer>
    </div>
  );
}
