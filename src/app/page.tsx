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
  reactions?: Reactions; 
}

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

  const handleAddReaction = async (reviewId: string, reactionKey: keyof Reactions) => {
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      const currentReactions = review.reactions || {};
      const currentCount = currentReactions[reactionKey] || 0;

      await updateDoc(reviewRef, {
        [`reactions.${reactionKey}`]: currentCount + 1
      });
    } catch (error) {
      console.error("リアクションの送信に失敗しました:", error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedSportId(expandedSportId === id ? null : id);
    setTimeout(() => {
      const element = document.getElementById(`sport-card-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif", backgroundColor: "#f5f3ff" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ border: "4px solid #e9d8fd", borderTop: "4px solid #7c3aed", borderRadius: "50%", width: "45px", height: "45px", animation: "spin 1s linear infinite", margin: "0 auto 15px auto" }}></div>
          <p style={{ fontWeight: "800", color: "#6b21a8", fontSize: "14px" }}>ワクワクを読み込み中...</p>
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
    <div style={{ backgroundColor: "#fbfbfe", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", position: "relative", paddingBottom: "110px", color: "#2d3748" }}>
      
      {/* 🔮 ヘッダー（グラデーション×ポップ） */}
      <header style={{ 
        background: "linear-gradient(135deg, #6b21a8 0%, #4c1d95 100%)", 
        color: "white", 
        padding: "32px 16px 28px 16px", 
        textAlign: "center", 
        boxShadow: "0 6px 20px rgba(76, 29, 149, 0.15)", 
        borderRadius: "0 0 28px 28px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* 背景のポップな丸飾り */}
        <div style={{ position: "absolute", top: "-20px", left: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(163, 230, 53, 0.15)" }}></div>
        <div style={{ position: "absolute", bottom: "-30px", right: "-10px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(163, 230, 53, 0.1)" }}></div>

        <h1 style={{ fontSize: "24px", fontWeight: "900", margin: 0, letterSpacing: "1.5px", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
          🏆 Tsukuba Sports Day
        </h1>
        <p style={{ 
          fontSize: "12px", 
          backgroundColor: "#a3e635", 
          color: "#4c1d95", 
          margin: "10px auto 0 auto", 
          fontWeight: "800",
          padding: "4px 12px",
          borderRadius: "30px",
          display: "inline-block",
          boxShadow: "0 2px 8px rgba(163,230,83,0.3)"
        }}>
          ⚡️ リアルタイム待ち時間 ＆ 会場ガイド
        </p>
      </header>

      {/* 🗺️ 会場エリアマップ */}
      <section style={{ marginBottom: "32px", backgroundColor: "white", boxShadow: "0 4px 16px rgba(0,0,0,0.02)", borderBottom: "1px solid #e8e8f3" }}>
        <div style={{ padding: "18px 16px 4px 16px", maxWidth: "550px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "16px", color: "#4c1d95", fontWeight: "900", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "20px" }}>🗺️</span> 会場エリアマップ
          </h2>
        </div>
        
        <div style={{ 
          position: "relative", 
          width: "100%", 
          maxWidth: "800px", 
          margin: "12px auto 0 auto",
          overflow: "hidden", 
          backgroundColor: "#f5f3ff",
          borderTop: "3px solid #6b21a8",
          borderBottom: "3px solid #6b21a8"
        }}>
          <img 
            src="/map.jpg" 
            alt="スポーツ・デー 会場マップ"
            style={{ width: "100%", height: "auto", display: "block" }}
          />

          {/* マップ上の数字ピン */}
          {sports.map((sport) => {
            // 緑（スムーズ）と赤（混雑）のカラーコード（ポップに調整）
            let pinBg = "#84cc16"; // ライムグリーン
            let pinTextColor = "#ffffff";
            let pinBorder = "#4d7c0f";

            if (sport.waitingTime > 20) {
              pinBg = "#ef4444"; // ビビッドレッド
              pinBorder = "#991b1b";
            } else if (sport.waitingTime > 0) {
              pinBg = "#f97316"; // ポップオレンジ
              pinBorder = "#c2410c";
            }

            let position = { top: "50%", left: "50%" }; 
            const name = sport.name;
            if (name.includes("モルック")) {
              position = { top: "21%", left: "28%" };
            } else if (name.includes("インディアカ")) {
              position = { top: "21%", left: "71%" };
            } else if (name.includes("ボッチャ")) {
              position = { top: "53%", left: "25%" };
            } else if (name.includes("バブルサッカー") || name.includes("バブル")) {
              position = { top: "43%", left: "41%" };
            } else if (name.includes("イントロドン") || name.includes("イントロ")) {
              position = { top: "65%", left: "37%" };
            } else if (name.includes("器用3種")) {
              position = { top: "65%", left: "47%" };
            } else if (name.includes("気配切り") || name.includes("気配")) {
              position = { top: "43%", left: "61%" };
            } else if (name.includes("ダーツ")) {
              position = { top: "65%", left: "61%" };
            } else if (name.includes("サバゲー")) {
              position = { top: "53%", left: "77%" };
            }

            return (
              <div
                key={`pin-${sport.id}`}
                onClick={() => toggleExpand(sport.id)}
                style={{
                  position: "absolute",
                  top: position.top,
                  left: position.left,
                  transform: "translate(-50%, -100%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  filter: "drop-shadow(0px 6px 8px rgba(0,0,0,0.25))",
                  zIndex: 10,
                  transition: "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "translate(-50%, -100%) scale(0.9)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "translate(-50%, -100%) scale(1.1)"}
              >
                {/* 丸っこくしてアメコミ風の少し太めの枠線にしたピン */}
                <div style={{
                  backgroundColor: pinBg,
                  padding: "5px 11px",
                  borderRadius: "12px",
                  border: `2px solid ${pinBorder}`,
                  textAlign: "center",
                  boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3)"
                }}>
                  <div style={{ 
                    fontSize: "15px", 
                    fontWeight: "900", 
                    color: pinTextColor, 
                    lineHeight: "1.1",
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "center"
                  }}>
                    {sport.waitingTime}
                    <span style={{ fontSize: "10px", marginLeft: "1.5px", opacity: 0.9 }}>分</span>
                  </div>
                </div>
                {/* ピンのしっぽ */}
                <div style={{
                  width: 0,
                  height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: `6px solid ${pinBorder}`,
                  marginTop: "-1px"
                }}></div>
              </div>
            );
          })}
        </div>
        
        <div style={{ padding: "10px 16px 16px 16px", maxWidth: "550px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", color: "#6b7280", margin: 0, lineHeight: "1.5", fontWeight: "500" }}>
            💡 <strong style={{ color: "#6b21a8" }}>ピンをタップ</strong>すると、下部のアトラクション詳細カードへスクロールして自動で開きます！
          </p>
        </div>
      </section>

      {/* メインコンテンツ */}
      <main style={{ maxWidth: "550px", margin: "0 auto", padding: "0 14px 40px 14px" }}>
        
        {/* 📢 運営からのお知らせ */}
        <section style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "3px solid #6b21a8", paddingBottom: "8px" }}>
            <h2 style={{ fontSize: "16px", color: "#4c1d95", fontWeight: "900", margin: 0 }}>
              📢 運営からのお知らせ
            </h2>
            <span style={{ fontSize: "11px", backgroundColor: "#a3e635", color: "#3f6212", padding: "3px 10px", borderRadius: "12px", fontWeight: "900" }}>LIVE</span>
          </div>
          
          {announcements.length === 0 ? (
            <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "24px", textAlign: "center", border: "2px solid #e9d8fd" }}>
              <p style={{ color: "#a0aec0", fontSize: "13px", margin: 0, fontWeight: "500" }}>現在、新しいお知らせはありません。</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {announcements.map((ann) => (
                <div key={ann.id} style={{ 
                  backgroundColor: "white", 
                  borderRadius: "16px", 
                  padding: "16px 18px", 
                  boxShadow: "0 6px 0px rgba(107, 33, 168, 0.1)", 
                  border: "2px solid #e9d8fd",
                  borderLeft: "6px solid #6b21a8"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "900", color: "#1a202c", margin: 0 }}>{ann.title}</h3>
                    <span style={{ fontSize: "10px", color: "#7c3aed", fontWeight: "bold" }}>{formatTime(ann.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#4b5563", margin: 0, lineHeight: "1.6", whiteSpace: "pre-wrap", fontWeight: "500" }}>
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ⏱ 各アトラクション情報 */}
        <section style={{ marginBottom: "36px" }}>
          <div style={{ borderBottom: "3px solid #4c1d95", paddingBottom: "8px", marginBottom: "18px" }}>
            <h2 style={{ fontSize: "16px", color: "#4c1d95", fontWeight: "900", margin: 0 }}>
              ⏱ 各アトラクション情報
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {sports.map((sport) => {
              let statusBg = "#f0fdf4";
              let statusBorder = "#bbf7d0";
              let statusColor = "#15803d";
              let statusText = "スムーズ";

              if (sport.waitingTime > 20) {
                statusBg = "#fef2f2";
                statusBorder = "#fecaca";
                statusColor = "#b91c1c";
                statusText = "大混雑中";
              } else if (sport.waitingTime > 0) {
                statusBg = "#fff7ed";
                statusBorder = "#ffedd5";
                statusColor = "#c2410c";
                statusText = "やや混雑";
              }

              const filteredReviews = reviews.filter(rev => 
                rev.text.toLowerCase().includes(sport.name.toLowerCase())
              );

              const isExpanded = expandedSportId === sport.id;

              return (
                <div
                  key={sport.id}
                  id={`sport-card-${sport.id}`}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "20px",
                    overflow: "hidden",
                    boxShadow: isExpanded ? "0 8px 0px rgba(107, 33, 168, 0.15)" : "0 4px 0px rgba(226, 232, 240, 0.8)",
                    border: isExpanded ? "3px solid #6b21a8" : "2px solid #e2e8f0",
                    padding: "16px 18px",
                    transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.1)"
                  }}
                >
                  <div 
                    onClick={() => toggleExpand(sport.id)}
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#1e1b4b", margin: 0 }}>{sport.name}</h3>
                        <span style={{ 
                          fontSize: "10px", 
                          backgroundColor: "#f3e8ff", 
                          color: "#6b21a8", 
                          padding: "2px 8px", 
                          borderRadius: "8px", 
                          fontWeight: "800" 
                        }}>
                          {isExpanded ? "▲ 閉じる" : "▼ 詳細・つぶやき"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "10px" }}>
                        <span style={{ fontSize: "11px", backgroundColor: "#f3f4f6", border: "1.5px solid #e5e7eb", padding: "4px 10px", borderRadius: "12px", color: "#374151", fontWeight: "700" }}>
                          📍 {sport.location}
                        </span>
                        <span style={{ 
                          fontSize: "11px", 
                          backgroundColor: statusBg, 
                          border: `1.5px solid ${statusBorder}`, 
                          color: statusColor, 
                          padding: "4px 10px", 
                          borderRadius: "12px", 
                          fontWeight: "900" 
                        }}>
                          {statusText}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", minWidth: "75px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: "36px", fontWeight: "900", color: statusColor, lineHeight: "1" }}>
                          {sport.waitingTime}
                        </span>
                        <span style={{ fontSize: "12px", marginLeft: "2px", color: "#4b5563", fontWeight: "900" }}>分</span>
                      </div>
                      <span style={{ fontSize: "9px", color: "#9ca3af", display: "block", marginTop: "6px", fontWeight: "700" }}>
                        更新: {formatTime(sport.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ animation: "fadeIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.1)" }}>
                      {sport.description && (
                        <div style={{ 
                          marginTop: "16px", 
                          paddingTop: "16px", 
                          borderTop: "2.5px dashed #f3e8ff", 
                          fontSize: "13px", 
                          color: "#4b5563", 
                          lineHeight: "1.6",
                          fontWeight: "500"
                        }}>
                          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{sport.description}</p>
                        </div>
                      )}

                      <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "2px solid #f3f4f6" }}>
                        <span style={{ fontSize: "12px", fontWeight: "900", color: "#6b21a8", display: "block", marginBottom: "10px" }}>
                          💬 この種目のリアルつぶやき ({filteredReviews.length}件)
                        </span>
                        
                        {filteredReviews.length === 0 ? (
                          <p style={{ color: "#9ca3af", fontSize: "12px", margin: "4px 0 0 0", fontStyle: "italic", fontWeight: "500" }}>
                            現在、この種目に関するつぶやきはありません。右下の＋ボタンから最初の声を投稿してみてね！
                          </p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {filteredReviews.map((rev) => (
                              <div key={rev.id} style={{ 
                                backgroundColor: "#faf5ff", 
                                padding: "14px", 
                                borderRadius: "14px", 
                                border: "2px solid #f3e8ff" 
                              }}>
                                <p style={{ fontSize: "13px", color: "#1e1b4b", margin: "0 0 6px 0", lineHeight: "1.5", fontWeight: "600" }}>
                                  {rev.text}
                                </p>
                                <span style={{ fontSize: "10px", color: "#9ca3af", display: "block", marginBottom: "10px", fontWeight: "600" }}>
                                  {formatTime(rev.createdAt)}
                                </span>

                                {/* 👍 リアクションボタン */}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
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
                                          backgroundColor: count > 0 ? "#f3e8ff" : "white",
                                          border: count > 0 ? "2px solid #c084fc" : "2px solid #e5e7eb",
                                          borderRadius: "14px",
                                          padding: "4px 10px",
                                          fontSize: "12px",
                                          cursor: "pointer",
                                          transition: "all 0.1s ease"
                                        }}
                                        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.9)"}
                                        onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                                      >
                                        <span>{item.emoji}</span>
                                        <span style={{ fontWeight: "900", color: count > 0 ? "#6b21a8" : "#9ca3af" }}>{count}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* 💬 返信 */}
                                {rev.replies && rev.replies.length > 0 && (
                                  <div style={{ 
                                    backgroundColor: "white", 
                                    padding: "10px 12px", 
                                    borderRadius: "12px", 
                                    display: "flex", 
                                    flexDirection: "column", 
                                    gap: "8px", 
                                    marginTop: "8px", 
                                    border: "2px solid #f3e8ff" 
                                  }}>
                                    {rev.replies.map((reply, idx) => (
                                      <div key={idx} style={{ 
                                        fontSize: "12px", 
                                        borderBottom: idx !== rev.replies!.length - 1 ? "1.5px solid #f3e8ff" : "none", 
                                        paddingBottom: "6px" 
                                      }}>
                                        <span style={{ color: "#7c3aed", fontSize: "10px", display: "block", fontWeight: "800" }}>
                                          💬 運営・参加者からの返信 ({reply.createdAt})
                                        </span>
                                        <p style={{ margin: "4px 0 0 0", color: "#374151", lineHeight: "1.5", fontWeight: "500" }}>{reply.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* 💬 返信投稿 */}
                                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                                  <input 
                                    type="text"
                                    placeholder="返答を入力..."
                                    value={replyInputs[rev.id] || ""}
                                    onChange={(e) => setReplyInputs(prev => ({ ...prev, [rev.id]: e.target.value }))}
                                    style={{ 
                                      flex: 1, 
                                      padding: "8px 12px", 
                                      borderRadius: "10px", 
                                      border: "2px solid #e5e7eb", 
                                      fontSize: "12px", 
                                      outline: "none", 
                                      boxSizing: "border-box", 
                                      color: "#1f2937", 
                                      backgroundColor: "white",
                                      fontWeight: "500"
                                    }}
                                  />
                                  <button
                                    onClick={() => handlePostReply(rev.id)}
                                    style={{ 
                                      backgroundColor: "#a3e635", 
                                      color: "#3f6212", 
                                      border: "2px solid #4d7c0f", 
                                      borderRadius: "10px", 
                                      padding: "8px 16px", 
                                      fontSize: "12px", 
                                      fontWeight: "900", 
                                      cursor: "pointer",
                                      boxShadow: "0 2px 0px #4d7c0f"
                                    }}
                                    onMouseDown={(e) => e.currentTarget.style.transform = "translateY(2px)"}
                                    onMouseUp={(e) => e.currentTarget.style.transform = "translateY(0px)"}
                                  >
                                    送信
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
        <section style={{ 
          backgroundColor: "white", 
          borderRadius: "24px", 
          padding: "24px 20px", 
          boxShadow: "0 6px 0px rgba(107, 33, 168, 0.08)", 
          border: "3px solid #6b21a8" 
        }}>
          <h2 style={{ fontSize: "16px", color: "#6b21a8", fontWeight: "900", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>💬</span> みんなの最新のつぶやき
          </h2>
          {reviews.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0, fontWeight: "500" }}>まだ投稿はありません。最初の声を届けよう！</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {reviews.slice(0, 5).map((rev) => ( 
                <div key={rev.id} style={{ 
                  backgroundColor: "#fbfbfe", 
                  borderRadius: "14px", 
                  padding: "14px", 
                  border: "2px solid #e5e7eb" 
                }}>
                  <p style={{ fontSize: "13px", color: "#1e1b4b", margin: "0 0 6px 0", lineHeight: "1.5", fontWeight: "600" }}>{rev.text}</p>
                  <span style={{ fontSize: "10px", color: "#9ca3af", display: "block", marginBottom: "10px", fontWeight: "600" }}>{formatTime(rev.createdAt)}</span>

                  {/* 👍 リアクションエリア */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
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
                            backgroundColor: count > 0 ? "#f3e8ff" : "white",
                            border: count > 0 ? "2px solid #c084fc" : "2px solid #e5e7eb",
                            borderRadius: "14px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            cursor: "pointer",
                            transition: "all 0.1s"
                          }}
                        >
                          <span>{item.emoji}</span>
                          <span style={{ fontWeight: "900", color: count > 0 ? "#6b21a8" : "#9ca3af" }}>{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 💬 返信一覧 */}
                  {rev.replies && rev.replies.length > 0 && (
                    <div style={{ 
                      backgroundColor: "white", 
                      padding: "10px 12px", 
                      borderRadius: "12px", 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "8px", 
                      marginTop: "8px", 
                      border: "2px solid #f3e8ff" 
                    }}>
                      {rev.replies.map((reply, idx) => (
                        <div key={idx} style={{ 
                          fontSize: "12px", 
                          borderBottom: idx !== rev.replies!.length - 1 ? "1.5px solid #f3e8ff" : "none", 
                          paddingBottom: "6px" 
                        }}>
                          <span style={{ color: "#7c3aed", fontSize: "10px", display: "block", fontWeight: "800" }}>💬 返信 ({reply.createdAt})</span>
                          <p style={{ margin: "4px 0 0 0", color: "#374151", lineHeight: "1.5", fontWeight: "500" }}>{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 💬 返信フォーム */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <input 
                      type="text"
                      placeholder="返答を入力..."
                      value={replyInputs[rev.id] || ""}
                      onChange={(e) => setReplyInputs(prev => ({ ...prev, [rev.id]: e.target.value }))}
                      style={{ 
                        flex: 1, 
                        padding: "8px 12px", 
                        borderRadius: "10px", 
                        border: "2px solid #e5e7eb", 
                        fontSize: "12px", 
                        outline: "none", 
                        boxSizing: "border-box", 
                        color: "#1f2937", 
                        backgroundColor: "white",
                        fontWeight: "500"
                      }}
                    />
                    <button
                      onClick={() => handlePostReply(rev.id)}
                      style={{ 
                        backgroundColor: "#a3e635", 
                        color: "#3f6212", 
                        border: "2px solid #4d7c0f", 
                        borderRadius: "10px", 
                        padding: "8px 16px", 
                        fontSize: "12px", 
                        fontWeight: "900", 
                        cursor: "pointer",
                        boxShadow: "0 2px 0px #4d7c0f"
                      }}
                    >
                      送信
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ➕ 新規投稿ボタン（ライムグリーンに紫ボーダーのポップデザイン） */}
      <Link href="/new" style={{
        position: "fixed",
        bottom: "28px",
        right: "24px",
        backgroundColor: "#a3e635",
        color: "#4c1d95",
        width: "60px",
        height: "60px",
        borderRadius: "20px", // 少し丸っこい四角形に
        border: "3px solid #4c1d95",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "32px",
        boxShadow: "0 6px 0px #4c1d95",
        cursor: "pointer",
        textDecoration: "none",
        zIndex: 100,
        fontWeight: "900",
        transition: "transform 0.1s, box-shadow 0.1s"
      }}
      // タップした時に少し沈むポップなアニメーション
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translateY(4px)";
        e.currentTarget.style.boxShadow = "0 2px 0px #4c1d95";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "0 6px 0px #4c1d95";
      }}
      >
        ＋
      </Link>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}