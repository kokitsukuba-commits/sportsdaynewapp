"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";

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

interface Reply {
  text: string;
  createdAt: string;
}

interface Review {
  id: string;
  text: string;
  createdAt: any;
  replies?: Reply[];
}

export default function AdminPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");

  const [newSportName, setNewSportName] = useState("");
  const [newSportLocation, setNewSportLocation] = useState("");
  const [newSportDescription, setNewSportDescription] = useState("");
  const [newSportWaitingTime, setNewSportWaitingTime] = useState(0);

  const ADMIN_PASSCODE = "5193";

  useEffect(() => {
    if (!isAuthenticated) return;

    const qSports = query(collection(db, "sports"), orderBy("name", "asc"));
    const unsubSports = onSnapshot(qSports, (snapshot) => {
      const sportsData: Sport[] = [];
      snapshot.forEach((doc) => {
        sportsData.push({ id: doc.id, ...doc.data() } as Sport);
      });
      setSports(sportsData);
    });

    const qAnnouncements = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      const announcementsData: Announcement[] = [];
      snapshot.forEach((doc) => {
        announcementsData.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      setAnnouncements(announcementsData);
    });

    const qReviews = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsubReviews = onSnapshot(qReviews, (snapshot) => {
      const reviewsData: Review[] = [];
      snapshot.forEach((doc) => {
        reviewsData.push({ id: doc.id, ...doc.data() } as Review);
      });
      setReviews(reviewsData);
    });

    return () => {
      unsubSports();
      unsubAnnouncements();
      unsubReviews();
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
    } else {
      alert("❌ パスコードが違います。");
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      alert("タイトルと内容を入力してください。");
      return;
    }

    try {
      await addDoc(collection(db, "announcements"), {
        title: announcementTitle,
        content: announcementContent,
        createdAt: serverTimestamp(),
      });
      setAnnouncementTitle("");
      setAnnouncementContent("");
      alert("📢 お知らせを投稿しました！");
    } catch (error) {
      console.error(error);
      alert("❌ お知らせの投稿に失敗しました。");
    }
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (!confirm(`本当に「${title}」のお知らせを削除しますか？`)) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      alert("お知らせを削除しました。");
    } catch (error) {
      console.error(error);
      alert("お知らせの削除に失敗しました。");
    }
  };

  // 🗑 つぶやき全体の削除
  const handleDeleteReview = async (id: string, text: string) => {
    const previewText = text.length > 20 ? text.substring(0, 20) + "..." : text;
    if (!confirm(`本当にこのつぶやきを削除しますか？\n「${previewText}」\n※ついてる返信もすべて消去されます。`)) return;
    
    try {
      await deleteDoc(doc(db, "reviews", id));
      alert("つぶやきを削除しました。");
    } catch (error) {
      console.error(error);
      alert("つぶやきの削除に失敗しました。");
    }
  };

  // 🗑 特定の返信のみ個別削除する処理（新規追加！）
  const handleDeleteReply = async (reviewId: string, replyIndex: number) => {
    const parentReview = reviews.find(r => r.id === reviewId);
    if (!parentReview || !parentReview.replies) return;

    const replyToDelete = parentReview.replies[replyIndex];
    if (!confirm(`本当にこの返信を削除しますか？\n「${replyToDelete.text}」`)) return;

    try {
      // 削除対象のインデックスを外した新しい返信配列を作成
      const updatedReplies = parentReview.replies.filter((_, idx) => idx !== replyIndex);
      
      const reviewRef = doc(db, "reviews", reviewId);
      await updateDoc(reviewRef, {
        replies: updatedReplies
      });
      alert("返信を削除しました。");
    } catch (error) {
      console.error(error);
      alert("❌ 返信の削除に失敗しました。");
    }
  };

  const handleAddSport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSportName.trim() || !newSportLocation.trim()) {
      alert("種目名と場所を入力してください。");
      return;
    }

    try {
      await addDoc(collection(db, "sports"), {
        name: newSportName,
        location: newSportLocation,
        waitingTime: Number(newSportWaitingTime),
        description: newSportDescription,
        updatedAt: serverTimestamp(),
      });
      setNewSportName("");
      setNewSportLocation("");
      setNewSportDescription("");
      setNewSportWaitingTime(0);
      alert("🎉 新しい種目を追加しました！");
    } catch (error) {
      console.error(error);
      alert("❌ 追加に失敗しました。");
    }
  };

  const handleUpdateWaitingTime = async (id: string, time: number) => {
    try {
      const sportDoc = doc(db, "sports", id);
      await updateDoc(sportDoc, {
        waitingTime: time,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
      alert("更新に失敗しました。");
    }
  };

  const handleDeleteSport = async (id: string, name: string) => {
    if (!confirm(`本当に「${name}」を削除しますか？`)) return;
    try {
      await deleteDoc(doc(db, "sports", id));
      alert("削除しました。");
    } catch (error) {
      console.error(error);
      alert("削除に失敗しました。");
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f7f9fc", fontFamily: "sans-serif" }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", textAlign: "center", width: "300px" }}>
          <h1 style={{ fontSize: "18px", color: "#5a2575", marginBottom: "16px", fontWeight: "bold" }}>管理者ログイン</h1>
          <input
            type="password"
            placeholder="管理者用パスコード（4桁）"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e0", fontSize: "14px", textAlign: "center", marginBottom: "16px", outline: "none", boxSizing: "border-box" }}
          />
          <button type="submit" style={{ width: "100%", padding: "10px", backgroundColor: "#5a2575", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            ログイン
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f7f9fc", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", paddingBottom: "60px" }}>
      <header style={{ backgroundColor: "#2d3748", color: "white", padding: "16px", textAlign: "center" }}>
        <h1 style={{ fontSize: "18px", margin: 0, fontWeight: "bold" }}>⚙️ 運営管理者用コントロールパネル</h1>
      </header>

      <main style={{ maxWidth: "550px", margin: "0 auto", padding: "20px 16px" }}>
        
        {/* 📢 運営からのお知らせ管理セクション */}
        <section style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #cbd5e0" }}>
          <h2 style={{ fontSize: "15px", color: "#2d3748", fontWeight: "700", margin: "0 0 14px 0", borderBottom: "2px solid #5a2575", paddingBottom: "6px" }}>
            📢 運営からのお知らせ管理
          </h2>
          
          <form onSubmit={handleAddAnnouncement} style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "bold", color: "#4a5568", display: "block", marginBottom: "4px" }}>タイトル</label>
              <input
                type="text"
                placeholder="例：【重要】雨天プログラムへの移行について"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "12px", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "bold", color: "#4a5568", display: "block", marginBottom: "4px" }}>お知らせ内容</label>
              <textarea
                placeholder="雨天のため、午後のバブルサッカーは体育館での開催に変更となりました。"
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "12px", resize: "none", boxSizing: "border-box" }}
              />
            </div>
            <button type="submit" style={{ padding: "10px", backgroundColor: "#5a2575", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>
              新しいお知らせを配信する
            </button>
          </form>

          <div style={{ borderTop: "1px dashed #cbd5e0", paddingTop: "14px" }}>
            <h3 style={{ fontSize: "12px", fontWeight: "bold", color: "#4a5568", marginBottom: "8px" }}>配信中のお知らせ一覧</h3>
            {announcements.length === 0 ? (
              <p style={{ fontSize: "11px", color: "#718096", margin: 0 }}>現在投稿されているお知らせはありません。</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                {announcements.map((ann) => (
                  <div key={ann.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f7fafc", padding: "8px 12px", borderRadius: "6px", border: "1px solid #edf2f7" }}>
                    <div style={{ flex: 1, marginRight: "10px" }}>
                      <p style={{ fontSize: "12px", fontWeight: "bold", margin: 0, color: "#2d3748" }}>{ann.title}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                      style={{ padding: "4px 8px", backgroundColor: "#fff5f5", color: "#e53e3e", border: "1px solid #fed7d7", borderRadius: "4px", fontSize: "10px", cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap" }}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 💬 一般つぶやき（口コミ・返信）管理セクション */}
        <section style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #cbd5e0" }}>
          <h2 style={{ fontSize: "15px", color: "#2d3748", fontWeight: "700", margin: "0 0 14px 0", borderBottom: "2px solid #e2e8f0", paddingBottom: "6px" }}>
            💬 参加者のつぶやき ＆ 返信管理
          </h2>
          <p style={{ fontSize: "11px", color: "#718096", margin: "0 0 12px 0", lineHeight: "1.4" }}>
            不適切な親つぶやき、または特定の返信メッセージを個別に削除することができます。
          </p>

          {reviews.length === 0 ? (
            <p style={{ fontSize: "11px", color: "#718096", margin: 0 }}>投稿されたつぶやきはありません。</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "350px", overflowY: "auto" }}>
              {reviews.map((rev) => (
                <div key={rev.id} style={{ backgroundColor: "#f7fafc", padding: "12px", borderRadius: "8px", border: "1px solid #edf2f7" }}>
                  
                  {/* 親つぶやきエリア */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ flex: 1, marginRight: "12px" }}>
                      <span style={{ fontSize: "10px", backgroundColor: "#e2e8f0", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold", display: "inline-block", marginBottom: "4px", color: "#4a5568" }}>
                        親つぶやき
                      </span>
                      <p style={{ fontSize: "13px", color: "#2d3748", margin: 0, whiteSpace: "pre-wrap", lineHeight: "1.4", fontWeight: "600" }}>{rev.text}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteReview(rev.id, rev.text)}
                      style={{ padding: "4px 8px", backgroundColor: "#fff5f5", color: "#e53e3e", border: "1px solid #fed7d7", borderRadius: "4px", fontSize: "10px", cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap" }}
                    >
                      削除
                    </button>
                  </div>

                  {/* 返信ツリーエリア（返信ごとの個別削除！） */}
                  {rev.replies && rev.replies.length > 0 && (
                    <div style={{ backgroundColor: "white", borderRadius: "6px", padding: "8px", marginTop: "8px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {rev.replies.map((reply, index) => (
                        <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", borderBottom: index !== rev.replies!.length - 1 ? "1px solid #edf2f7" : "none", paddingBottom: "4px", paddingTop: "4px" }}>
                          <div style={{ flex: 1, marginRight: "10px" }}>
                            <span style={{ color: "#718096", fontSize: "9px", display: "block" }}>💬 返信 ({reply.createdAt})</span>
                            <p style={{ margin: "2px 0 0 0", color: "#4a5568" }}>{reply.text}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteReply(rev.id, index)}
                            style={{ padding: "2px 6px", backgroundColor: "#fff5f5", color: "#e53e3e", border: "1px solid #fed7d7", borderRadius: "4px", fontSize: "9px", cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap" }}
                          >
                            返信消去
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </section>

        {/* ➕ 新規種目追加セクション */}
        <section style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #cbd5e0" }}>
          <h2 style={{ fontSize: "15px", color: "#2d3748", fontWeight: "700", margin: "0 0 14px 0", borderBottom: "2px solid #5a2575", paddingBottom: "6px" }}>
            ➕ 新しいアトラクション（種目）を追加
          </h2>
          <form onSubmit={handleAddSport} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "11px", fontWeight: "bold", color: "#4a5568", display: "block", marginBottom: "4px" }}>種目名</label>
                <input
                  type="text"
                  placeholder="例：バブルサッカー"
                  value={newSportName}
                  onChange={(e) => setNewSportName(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "12px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "11px", fontWeight: "bold", color: "#4a5568", display: "block", marginBottom: "4px" }}>場所（コートなど）</label>
                <input
                  type="text"
                  placeholder="例：第3サッカー場"
                  value={newSportLocation}
                  onChange={(e) => setNewSportLocation(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "12px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "bold", color: "#4a5568", display: "block", marginBottom: "4px" }}>初期の待ち時間（分）</label>
              <input
                type="number"
                value={newSportWaitingTime}
                onChange={(e) => setNewSportWaitingTime(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "12px", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "bold", color: "#4a5568", display: "block", marginBottom: "4px" }}>種目の紹介説明（任意）</label>
              <textarea
                placeholder="ルールや持ち物などの詳細説明を入力"
                value={newSportDescription}
                onChange={(e) => setNewSportDescription(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "12px", resize: "none", boxSizing: "border-box" }}
              />
            </div>

            <button type="submit" style={{ padding: "10px", backgroundColor: "#5a2575", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>
              アトラクションを追加する
            </button>
          </form>
        </section>

        {/* ⏱ 既存種目の待ち時間管理・削除セクション */}
        <section style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <h2 style={{ fontSize: "15px", color: "#2d3748", fontWeight: "700", margin: "0 0 16px 0", borderBottom: "2px solid #edf2f7", paddingBottom: "6px" }}>
            ⏱ リアルタイム待ち時間管理
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {sports.map((sport) => (
              <div key={sport.id} style={{ borderBottom: "1px solid #edf2f7", paddingBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: 0, color: "#1a202c" }}>{sport.name}</h3>
                    <p style={{ fontSize: "11px", color: "#718096", margin: "2px 0 0 0" }}>📍 {sport.location}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteSport(sport.id, sport.name)}
                    style={{ padding: "4px 8px", backgroundColor: "#fff5f5", color: "#e53e3e", border: "1px solid #fed7d7", borderRadius: "4px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    削除
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button 
                    onClick={() => handleUpdateWaitingTime(sport.id, Math.max(0, sport.waitingTime - 5))}
                    style={{ padding: "8px 12px", backgroundColor: "#edf2f7", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    -5分
                  </button>
                  <div style={{ flex: 1, textAlign: "center", backgroundColor: "#f7fafc", padding: "6px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "18px", fontWeight: "bold", color: "#2d3748" }}>{sport.waitingTime}</span>
                    <span style={{ fontSize: "11px", color: "#718096", marginLeft: "2px" }}>分待ち</span>
                  </div>
                  <button 
                    onClick={() => handleUpdateWaitingTime(sport.id, sport.waitingTime + 5)}
                    style={{ padding: "8px 12px", backgroundColor: "#edf2f7", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    +5分
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}