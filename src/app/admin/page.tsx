"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

interface Sport {
  id: string;
  name: string;
  waitingTime: number;
  location: string;
  description?: string;
  updatedAt: any;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: any;
}

interface Review {
  id: string;
  text: string;
  createdAt: any;
}

export default function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const [sports, setSports] = useState<Sport[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // 新規追加用
  const [newSportName, setNewSportName] = useState("");
  const [newSportLocation, setNewSportLocation] = useState("");
  const [newSportDesc, setNewSportDesc] = useState("");
  const [sportAddStatus, setSportAddStatus] = useState("");

  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceContent, setAnnounceContent] = useState("");
  const [postStatus, setPostStatus] = useState("");

  const CORRECT_PASSCODE = "tsukuba2026";

  useEffect(() => {
    const savedAuth = sessionStorage.getItem("sportsday_admin_auth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === CORRECT_PASSCODE) {
      setIsAuthenticated(true);
      sessionStorage.setItem("sportsday_admin_auth", "true");
      setAuthError("");
    } else {
      setAuthError("❌ パスコードが正しくありません。");
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const qSports = query(collection(db, "sports"), orderBy("name", "asc"));
    const unsubscribeSports = onSnapshot(qSports, (snapshot) => {
      const sportsData: Sport[] = [];
      snapshot.forEach((doc) => {
        sportsData.push({ id: doc.id, ...doc.data() } as Sport);
      });
      setSports(sportsData);
    });

    const qAnnouncements = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribeAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      const announcementsData: Announcement[] = [];
      snapshot.forEach((doc) => {
        announcementsData.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      setAnnouncements(announcementsData);
    });

    // 管理画面で全口コミを同期
    const qReviews = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribeReviews = onSnapshot(qReviews, (snapshot) => {
      const reviewsData: Review[] = [];
      snapshot.forEach((doc) => {
        reviewsData.push({ id: doc.id, ...doc.data() } as Review);
      });
      setReviews(reviewsData);
      setLoading(false);
    });

    return () => {
      unsubscribeSports();
      unsubscribeAnnouncements();
      unsubscribeReviews();
    };
  }, [isAuthenticated]);

  const handleAddSport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSportName || !newSportLocation) {
      alert("種目名と実施場所を入力してください。");
      return;
    }
    setSportAddStatus("登録中...");
    try {
      const sportId = newSportName.toLowerCase().replace(/\s+/g, "-");
      await setDoc(doc(db, "sports", sportId), {
        name: newSportName,
        location: newSportLocation,
        waitingTime: 0,
        description: newSportDesc,
        updatedAt: serverTimestamp(),
      });
      setNewSportName("");
      setNewSportLocation("");
      setNewSportDesc("");
      setSportAddStatus("🎉 種目を登録しました！");
      setTimeout(() => setSportAddStatus(""), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteSport = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`【種目削除】「${name}」を完全に削除しますか？`);
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "sports", id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateWaitingTime = async (id: string, current: number, amount: number) => {
    if (!isOnline) return;
    const newTime = Math.max(0, current + amount);
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, "sports", id), {
        waitingTime: newTime,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) return;
    if (!announceTitle || !announceContent) return;

    const confirmPost = window.confirm("配信しますか？");
    if (!confirmPost) return;

    setPostStatus("投稿中...");
    try {
      await addDoc(collection(db, "announcements"), {
        title: announceTitle,
        content: announceContent,
        createdAt: serverTimestamp(),
      });
      setAnnounceTitle("");
      setAnnounceContent("");
      setPostStatus("🎉 配信成功");
      setTimeout(() => setPostStatus(""), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (!isOnline) return;
    if (!window.confirm(`「${title}」を削除しますか？`)) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm("⚠️ 不適切なつぶやきとして、この口コミを強制削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "reviews", id));
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "---";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  // 共通の入力欄用スタイル（文字色を黒、背景を白に固定）
  const inputStyle: React.CSSProperties = {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e0",
    fontSize: "13px",
    color: "#1a202c",
    backgroundColor: "white"
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f7f9fc", fontFamily: "sans-serif" }}>
        <div style={{ maxWidth: "380px", width: "100%", padding: "40px 30px", backgroundColor: "white", borderRadius: "20px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "40px", marginBottom: "15px" }}>🔐</div>
          <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#5a2575", marginBottom: "8px" }}>スポーツデイ 総合管理</h1>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <input 
              type="password" 
              placeholder="運営パスコードを入力" 
              value={passcode} 
              onChange={(e) => setPasscode(e.target.value)} 
              style={{ padding: "14px", borderRadius: "10px", border: "1px solid #cbd5e0", fontSize: "16px", textAlign: "center", color: "#1a202c", backgroundColor: "white" }}
            />
            <button type="submit" style={{ padding: "14px", backgroundColor: "#5a2575", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>ログイン</button>
          </form>
          {authError && <p style={{ marginTop: "15px", color: "#e53e3e", fontSize: "13px" }}>{authError}</p>}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: "100px", color: "#5a2575", fontFamily: "sans-serif" }}>読み込み中...</div>;
  }

  return (
    <div style={{ backgroundColor: "#f7f9fc", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <header style={{ backgroundColor: "#2d3748", color: "white", padding: "20px 16px", textAlign: "center", borderRadius: "0 0 16px 16px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>⚙️ Sports Day 運営ポータル</h1>
        <p style={{ fontSize: "11px", opacity: 0.8, margin: "4px 0 0 0" }}>管理・モデレーションモード</p>
      </header>

      <main style={{ maxWidth: "500px", margin: "0 auto", padding: "20px 16px 40px 16px" }}>

        {/* 新規種目登録 */}
        <section style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#2d3748", marginTop: 0, marginBottom: "12px" }}>➕ 新しい種目を登録</h2>
          <form onSubmit={handleAddSport} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input type="text" placeholder="種目名（例：バブルサッカー）" value={newSportName} onChange={(e) => setNewSportName(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="実施場所" value={newSportLocation} onChange={(e) => setNewSportLocation(e.target.value)} style={inputStyle} />
            <textarea placeholder="紹介文" value={newSportDesc} onChange={(e) => setNewSportDesc(e.target.value)} rows={2} style={{ ...inputStyle, resize: "none" }} />
            <button type="submit" style={{ padding: "10px", backgroundColor: "#5a2575", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold" }}>登録</button>
          </form>
          {sportAddStatus && <p style={{ marginTop: "10px", color: "#5a2575", textAlign: "center", fontSize: "12px" }}>{sportAddStatus}</p>}
        </section>

        {/* ⏱ 待ち時間＆種目の管理 */}
        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#2d3748", marginBottom: "12px" }}>⏱ 待ち時間変更 ＆ 種目削除</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sports.map((sport) => (
              <div key={sport.id} style={{ backgroundColor: "white", borderRadius: "16px", padding: "16px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", margin: 0 }}>{sport.name}</h4>
                    <span style={{ fontSize: "10px", color: "#718096" }}>📍 {sport.location}</span>
                  </div>
                  <button onClick={() => handleDeleteSport(sport.id, sport.name)} style={{ backgroundColor: "#fff5f5", color: "#e53e3e", border: "1px solid #fed7d7", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", cursor: "pointer" }}>削除</button>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px" }}>
                  <button onClick={() => handleUpdateWaitingTime(sport.id, sport.waitingTime, -5)} disabled={updatingId === sport.id || sport.waitingTime === 0} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", backgroundColor: "#fc8181", color: "white", fontSize: "18px" }}>-</button>
                  <div style={{ minWidth: "40px", textAlign: "center" }}><span style={{ fontSize: "18px", fontWeight: "800" }}>{sport.waitingTime}</span>分</div>
                  <button onClick={() => handleUpdateWaitingTime(sport.id, sport.waitingTime, 5)} disabled={updatingId === sport.id} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", backgroundColor: "#68d391", color: "white", fontSize: "16px" }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 📢 お知らせ配信 */}
        <section style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#2d3748", marginTop: 0, marginBottom: "12px" }}>📢 お知らせ配信</h2>
          <form onSubmit={handlePostAnnouncement} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input type="text" placeholder="タイトル" value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} style={inputStyle} />
            <textarea placeholder="本文..." value={announceContent} onChange={(e) => setAnnounceContent(e.target.value)} rows={2} style={{ ...inputStyle, resize: "none" }} />
            <button type="submit" style={{ padding: "10px", backgroundColor: "#3182ce", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold" }}>配信</button>
          </form>
          {postStatus && <p style={{ marginTop: "10px", color: "#3182ce", textAlign: "center", fontSize: "12px" }}>{postStatus}</p>}
        </section>

        {/* 💬 口コミ管理 */}
        <section style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#2d3748", marginTop: 0, marginBottom: "12px" }}>💬 投稿された口コミの管理</h2>
          {reviews.length === 0 ? (
            <p style={{ color: "#a0aec0", fontSize: "12px", textAlign: "center" }}>投稿された口コミはありません。</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reviews.map((rev) => (
                <div key={rev.id} style={{ backgroundColor: "#f7fafc", borderRadius: "8px", padding: "10px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1, marginRight: "10px" }}>
                    <p style={{ fontSize: "12px", color: "#2d3748", margin: "0 0 4px 0" }}>{rev.text}</p>
                    <span style={{ fontSize: "10px", color: "#a0aec0" }}>{formatTime(rev.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    style={{ backgroundColor: "#fff5f5", color: "#e53e3e", border: "1px solid #fed7d7", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", cursor: "pointer" }}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}