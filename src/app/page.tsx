"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  arrayUnion 
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

// 💬 リアクション用の型定義（各絵文字のカウント数）
interface Reactions {
  like?: number;    // 👍
  love?: number;    // ❤️
  laugh?: number;   // 😆
  sad?: number;     // 😭
  fire?: number;    // 🔥
}

interface Review {
  id: string;
  text: string;
  createdAt: any;
  replies?: Reply[];
  reactions?: Reactions; // 👈 リアクションプロパティを追加
}

// 利用可能なリアクション一覧
const REACTION_EMOJIS = [
  { key: "like", emoji: "👍" },
  { key: "love", emoji: "❤️" },
  { key: "laugh", emoji: "😆" },
  { key: "sad", emoji: "😭" },
  { key: "fire", emoji: "🔥" }
] as const;

export default function UserPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});
  const [expandedSportId, setExpandedSportId] = useState<string | null>(null);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "---";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
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
      setLoading(false);
    });

    return () => {
      unsubSports();
      unsubAnnouncements();
      unsubReviews();
    };
  }, []);

  // 💬 返信の送信処理
  const handlePostReply = async (reviewId: string) => {
    const replyText = replyInputs[reviewId];
    if (!replyText || !replyText.trim()) return;

    try {
      const reviewRef = doc(db, "reviews", reviewId);
      const newReply: Reply = {
        text: replyText,
        createdAt: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
      };

      await updateDoc(reviewRef, {
        replies: arrayUnion(newReply)
      });

      setReplyInputs(prev => ({ ...prev, [reviewId]: "" }));
    } catch (error) {
      console.error(error);
      alert("❌ 返信の送信に失敗しました。");
    }
  };

  // 👍 リアクションの追加処理
  const handleAddReaction = async (reviewId: string, reactionKey: keyof Reactions) => {
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      
      // 対象のつぶやきを取得
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      const currentReactions = review.reactions || {};
      const currentCount = currentReactions[reactionKey] || 0;

      // リアクションのカウントを+1する
      await updateDoc(reviewRef, {
        [`reactions.${reactionKey}`]: currentCount + 1
      });
    } catch (error) {
      console.error("リアクションの送信に失敗しました:", error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedSportId(expandedSportId === id ? null : id);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif", color: "#5a2575" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ border: "4px solid #f3f3f3", borderTop: "4px solid #5a2575", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 15px auto" }}></div>
          <p style={{ fontWeight: "bold" }}>情報を読み込み中...</p>
        </div>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f7f9fc", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", position: "relative", paddingBottom: "100px" }}>
      {/* ヘッダー */}
      <header style={{ backgroundColor: "#5a2575", color: "white", padding: "24px 16px", textAlign: "center", boxShadow: "0 4px 12px rgba(90, 37, 117, 0.2)", borderRadius: "0 0 20px 20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", margin: 0, letterSpacing: "1px" }}>
          🏆 Tsukuba Sports Day
        </h1>
        <p style={{ fontSize: "12px", opacity: 0.9, margin: "6px 0 0 0", fontWeight: "500" }}>
          リアルタイム待ち時間 ＆ 会場ガイド
        </p>
      </header>

      <main style={{ maxWidth: "500px", margin: "0 auto", padding: "20px 16px 40px 16px" }}>
        
        {/* 会場マップセクション */}
        <section style={{ marginBottom: "28px", backgroundColor: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "15px", color: "#2d3748", fontWeight: "700", margin: "0 0 12px 0", borderBottom: "2px solid #cbd5e0", paddingBottom: "6px" }}>
            🗺️ 会場エリアマップ
          </h2>
          <div style={{ width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid #edf2f7" }}>
            <img 
              src="/map.jpg" 
              alt="スポーツ・デー 会場マップ"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
          <p style={{ fontSize: "10px", color: "#718096", margin: "8px 0 0 0", lineHeight: "1.4" }}>
            ※雨天の場合、会場や一部の種目が変更になります。また、諸事情により各種目の位置が変更になる場合があります。
          </p>
        </section>

        {/* 📢 アナウンスセクション */}
        <section style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "2px solid #5a2575", paddingBottom: "6px" }}>
            <h2 style={{ fontSize: "15px", color: "#5a2575", fontWeight: "700", margin: 0 }}>
              📢 運営からのお知らせ
            </h2>
            <span style={{ fontSize: "10px", backgroundColor: "#e9d8fd", color: "#5a2575", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>LIVE</span>
          </div>
          
          {announcements.length === 0 ? (
            <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <p style={{ color: "#a0aec0", fontSize: "13px", margin: 0 }}>現在、新しいお知らせはありません。</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {announcements.map((ann) => (
                <div key={ann.id} style={{ backgroundColor: "white", borderRadius: "12px", padding: "14px 16px", boxShadow: "0 4px 10px rgba(0,0,0,0.03)", borderLeft: "5px solid #5a2575" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#1a202c", margin: 0 }}>{ann.title}</h3>
                    <span style={{ fontSize: "10px", color: "#a0aec0" }}>{formatTime(ann.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#4a5568", margin: 0, lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ⏱ 各アトラクション情報セクション */}
        <section style={{ marginBottom: "32px" }}>
          <div style={{ borderBottom: "2px solid #2d3748", paddingBottom: "6px", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "15px", color: "#2d3748", fontWeight: "700", margin: 0 }}>
              ⏱ 各アトラクション情報
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {sports.map((sport) => {
              let statusColor = "#38a169";
              let statusText = "スムーズ";
              let bgLight = "#f0fff4";
              if (sport.waitingTime > 20) {
                statusColor = "#e53e3e";
                statusText = "混雑";
                bgLight = "#fff5f5";
              } else if (sport.waitingTime > 0) {
                statusColor = "#dd6b20";
                statusText = "やや混雑";
                bgLight = "#fffaf0";
              }

              const filteredReviews = reviews.filter(rev => 
                rev.text.toLowerCase().includes(sport.name.toLowerCase())
              );

              const isExpanded = expandedSportId === sport.id;

              return (
                <div
                  key={sport.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 6px 15px rgba(0,0,0,0.04)",
                    border: isExpanded ? "1.5px solid #5a2575" : "1px solid #e2e8f0",
                    padding: "16px",
                    transition: "all 0.2s ease-in-out"
                  }}
                >
                  <div 
                    onClick={() => toggleExpand(sport.id)}
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "flex-start", 
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a202c", margin: 0 }}>{sport.name}</h3>
                        <span style={{ fontSize: "10px", color: "#a0aec0" }}>
                          {isExpanded ? "▲ 閉じる" : "▼ タップで詳細"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "8px" }}>
                        <span style={{ fontSize: "11px", backgroundColor: "#f7fafc", border: "1px solid #e2e8f0", padding: "3px 8px", borderRadius: "20px", color: "#4a5568", fontWeight: "500" }}>
                          📍 {sport.location}
                        </span>
                        <span style={{ fontSize: "11px", backgroundColor: bgLight, color: statusColor, padding: "3px 8px", borderRadius: "20px", fontWeight: "700" }}>
                          {statusText}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: "32px", fontWeight: "800", color: statusColor, lineHeight: "1" }}>
                          {sport.waitingTime}
                        </span>
                        <span style={{ fontSize: "11px", marginLeft: "2px", color: "#718096", fontWeight: "bold" }}>分</span>
                      </div>
                      <span style={{ fontSize: "9px", color: "#a0aec0", display: "block", marginTop: "4px" }}>
                        更新: {formatTime(sport.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ animation: "fadeIn 0.25s ease-out" }}>
                      {sport.description && (
                        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed #edf2f7", fontSize: "12px", color: "#4a5568", lineHeight: "1.5" }}>
                          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{sport.description}</p>
                        </div>
                      )}

                      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #edf2f7" }}>
                        <span style={{ fontSize: "11px", fontWeight: "bold", color: "#5a2575", display: "block", marginBottom: "8px" }}>
                          💬 参加者のリアルな口コミ ({filteredReviews.length}件)
                        </span>
                        
                        {filteredReviews.length === 0 ? (
                          <p style={{ color: "#a0aec0", fontSize: "11px", margin: "4px 0 0 0", fontStyle: "italic" }}>
                            現在、この種目に関するつぶやきはありません。右下の＋ボタンから最初のつぶやきを投稿してみよう！
                          </p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {filteredReviews.map((rev) => (
                              <div key={rev.id} style={{ backgroundColor: "#fbf7ff", padding: "12px", borderRadius: "8px", border: "1px solid #f3ebfa" }}>
                                <p style={{ fontSize: "13px", color: "#2d3748", margin: "0 0 4px 0", lineHeight: "1.4", fontWeight: "500" }}>
                                  {rev.text}
                                </p>
                                <span style={{ fontSize: "9px", color: "#a0aec0", display: "block", marginBottom: "8px" }}>
                                  {formatTime(rev.createdAt)}
                                </span>

                                {/* 👍 LINE風リアクションエリア（アコーディオン内） */}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                                  {REACTION_EMOJIS.map((item) => {
                                    const count = rev.reactions?.[item.key] || 0;
                                    return (
                                      <button
                                        key={item.key}
                                        onClick={() => handleAddReaction(rev.id, item.key)}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          backgroundColor: "white",
                                          border: "1px solid #e2e8f0",
                                          borderRadius: "20px",
                                          padding: "3px 8px",
                                          fontSize: "11px",
                                          cursor: "pointer",
                                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                          transition: "transform 0.1s"
                                        }}
                                        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.92)"}
                                        onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                                      >
                                        <span>{item.emoji}</span>
                                        <span style={{ fontWeight: "bold", color: count > 0 ? "#5a2575" : "#a0aec0" }}>{count}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* 💬 返信一覧（文字色を白から濃いグレー #2d3748 に変更して見やすく修正！） */}
                                {rev.replies && rev.replies.length > 0 && (
                                  <div style={{ backgroundColor: "#f3f4f6", padding: "8px 10px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px", border: "1px solid #e5e7eb" }}>
                                    {rev.replies.map((reply, idx) => (
                                      <div key={idx} style={{ fontSize: "11px", borderBottom: idx !== rev.replies!.length - 1 ? "1px solid #e5e7eb" : "none", paddingBottom: "4px" }}>
                                        <span style={{ color: "#718096", fontSize: "9px", display: "block", fontWeight: "bold" }}>💬 返信 ({reply.createdAt})</span>
                                        <p style={{ margin: "2px 0 0 0", color: "#2d3748", lineHeight: "1.4" }}>{reply.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* 💬 返信書き込みフォーム */}
                                <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                                  <input 
                                    type="text"
                                    placeholder="返信を書き込む..."
                                    value={replyInputs[rev.id] || ""}
                                    onChange={(e) => setReplyInputs(prev => ({ ...prev, [rev.id]: e.target.value }))}
                                    style={{ flex: 1, padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "11px", outline: "none", boxSizing: "border-box", color: "#1a202c", backgroundColor: "white" }}
                                  />
                                  <button
                                    onClick={() => handlePostReply(rev.id)}
                                    style={{ backgroundColor: "#5a2575", color: "white", border: "none", borderRadius: "6px", padding: "5px 12px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                                  >
                                    返信
                                  </button>
                                </div>

                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 💬 みんなの最新のつぶやき */}
        <section style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 12px rgba(90, 37, 117, 0.05)", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "15px", color: "#5a2575", fontWeight: "700", margin: "0 0 12px 0" }}>
            💬 みんなの最新のつぶやき
          </h2>
          {reviews.length === 0 ? (
            <p style={{ color: "#a0aec0", fontSize: "11px", margin: 0 }}>まだ投稿はありません。最初の声を届けよう！</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reviews.slice(0, 5).map((rev) => ( 
                <div key={rev.id} style={{ backgroundColor: "#f7fafc", borderRadius: "8px", padding: "12px", border: "1px solid #e2e8f0" }}>
                  <p style={{ fontSize: "13px", color: "#2d3748", margin: "0 0 4px 0", lineHeight: "1.4", fontWeight: "500" }}>{rev.text}</p>
                  <span style={{ fontSize: "9px", color: "#a0aec0", display: "block", marginBottom: "8px" }}>{formatTime(rev.createdAt)}</span>

                  {/* 👍 LINE風リアクションエリア（タイムライン） */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                    {REACTION_EMOJIS.map((item) => {
                      const count = rev.reactions?.[item.key] || 0;
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleAddReaction(rev.id, item.key)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "20px",
                            padding: "3px 8px",
                            fontSize: "11px",
                            cursor: "pointer",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                            transition: "transform 0.1s"
                          }}
                          onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.92)"}
                          onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                          <span>{item.emoji}</span>
                          <span style={{ fontWeight: "bold", color: count > 0 ? "#5a2575" : "#a0aec0" }}>{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 💬 返信一覧（文字色を白から濃いグレー #2d3748 に変更して見やすく修正！） */}
                  {rev.replies && rev.replies.length > 0 && (
                    <div style={{ backgroundColor: "#edf2f7", padding: "8px 10px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px", border: "1px solid #e2e8f0" }}>
                      {rev.replies.map((reply, idx) => (
                        <div key={idx} style={{ fontSize: "11px", borderBottom: idx !== rev.replies!.length - 1 ? "1px solid #e2e8f0" : "none", paddingBottom: "4px" }}>
                          <span style={{ color: "#718096", fontSize: "9px", display: "block", fontWeight: "bold" }}>💬 返信 ({reply.createdAt})</span>
                          <p style={{ margin: "2px 0 0 0", color: "#2d3748", lineHeight: "1.4" }}>{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 💬 返信書き込みフォーム */}
                  <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                    <input 
                      type="text"
                      placeholder="返信を書き込む..."
                      value={replyInputs[rev.id] || ""}
                      onChange={(e) => setReplyInputs(prev => ({ ...prev, [rev.id]: e.target.value }))}
                      style={{ flex: 1, padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "11px", outline: "none", boxSizing: "border-box", color: "#1a202c", backgroundColor: "white" }}
                    />
                    <button
                      onClick={() => handlePostReply(rev.id)}
                      style={{ backgroundColor: "#5a2575", color: "white", border: "none", borderRadius: "6px", padding: "5px 12px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      返信
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ➕ 右下に浮かぶ新規投稿ボタン */}
      <Link href="/new" style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        backgroundColor: "#5a2575",
        color: "white",
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
        boxShadow: "0 4px 16px rgba(90, 37, 117, 0.4)",
        cursor: "pointer",
        textDecoration: "none",
        zIndex: 100,
        fontWeight: "300"
      }}>
        ＋
      </Link>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}