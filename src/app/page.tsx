"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
    <div style={{ backgroundColor: "#fbf9fc", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", position: "relative", paddingBottom: "120px" }}>
      
      {/* 🏆 ヘッダー（キャラクター・ロゴ付き） */}
      <header style={{ 
        backgroundColor: "#5a2575", 
        color: "white", 
        padding: "24px 16px 20px 16px", 
        textAlign: "center", 
        boxShadow: "0 4px 15px rgba(90, 37, 117, 0.25)", 
        borderRadius: "0 0 24px 24px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)" }}></div>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "550px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* 左側: ひょっこり丸枠マスコット (sp.png) */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ position: "relative", width: "45px", height: "45px" }}>
              <Image 
                src="/sp.png" 
                alt="SDマスコット" 
                fill
                style={{ objectFit: "contain", transform: "rotate(-5deg)", filter: "drop-shadow(2px 3px 4px rgba(0,0,0,0.2))" }}
                priority
              />
            </div>
            <div style={{ textAlign: "left" }}>
              <h1 style={{ fontSize: "19px", fontWeight: "900", margin: 0, letterSpacing: "0.5px", textShadow: "0 2px 4px rgba(0,0,0,0.15)" }}>
                Tsukuba Sports Day
              </h1>
              <p style={{ fontSize: "11px", opacity: 0.95, margin: "2px 0 0 0", fontWeight: "600", color: "#f7e8ff" }}>
                リアルタイム待ち時間 ＆ 会場ガイド
              </p>
            </div>
          </div>

          {/* 右側: SD紫ロゴ (SD.png) */}
          <div style={{ position: "relative", width: "55px", height: "35px" }}>
            <Image
              src="/SD.png"
              alt="SD Logo"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      </header>

      {/* 🗺️ 会場エリアマップ */}
      <section style={{ marginBottom: "28px", backgroundColor: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ padding: "16px 14px 4px 14px", maxWidth: "550px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "15px", color: "#2d3748", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🗺️</span> 会場エリアマップ（待ち時間）
          </h2>
        </div>
        
        {/* 地図とピンを重ねる親コンテナ */}
        <div style={{ 
          position: "relative", 
          width: "100%", 
          maxWidth: "800px", 
          margin: "10px auto 0 auto",
          overflow: "hidden", 
          backgroundColor: "#f7fafc",
          borderTop: "1px solid #edf2f7",
          borderBottom: "1px solid #edf2f7"
        }}>
          <img 
            src="/map.jpg" 
            alt="スポーツ・デー 会場マップ"
            style={{ width: "100%", height: "auto", display: "block" }}
          />

          {/* リアルタイム待ち時間ピン群 */}
          {sports.map((sport) => {
            let pinColor = "#38a169"; // スムーズ（緑）
            if (sport.waitingTime > 20) {
              pinColor = "#e53e3e"; // 混雑（赤）
            } else if (sport.waitingTime > 0) {
              pinColor = "#dd6b20"; // やや混雑（オレンジ）
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
                  filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.35))",
                  zIndex: 10,
                  transition: "transform 0.15s ease"
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "translate(-50%, -100%) scale(0.95)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "translate(-50%, -100%) scale(1)"}
              >
                <div style={{
                  backgroundColor: "white",
                  padding: "5px 10px",
                  borderRadius: "9px",
                  border: `2px solid ${pinColor}`,
                  textAlign: "center",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
                }}>
                  <div style={{ 
                    fontSize: "14px", 
                    fontWeight: "900", 
                    color: pinColor, 
                    lineHeight: "1",
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "center"
                  }}>
                    {sport.waitingTime}
                    <span style={{ fontSize: "9px", fontWeight: "bold", marginLeft: "1px", color: "#718096" }}>分</span>
                  </div>
                </div>
                <div style={{
                  width: 0,
                  height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: `6px solid ${pinColor}`,
                  marginTop: "-1px"
                }}></div>
              </div>
            );
          })}
        </div>
        
        <div style={{ padding: "8px 14px 14px 14px", maxWidth: "550px", margin: "0 auto" }}>
          <p style={{ fontSize: "10px", color: "#718096", margin: 0, lineHeight: "1.4" }}>
            ※マップ上の数字ピンをタップすると、下部のアトラクション詳細カードへ直接スクロールして開きます。
          </p>
        </div>
      </section>

      {/* メインエリア */}
      <main style={{ maxWidth: "550px", margin: "0 auto", padding: "0 12px 40px 12px" }}>
        
        {/* 📢 アナウンスセクション */}
        <section style={{ marginBottom: "28px" }}>
          {/* ↓↓↓ justifycontent を justifyContent に修正しました ↓↓↓ */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "2px solid #5a2575", paddingBottom: "6px" }}>
            <h2 style={{ fontSize: "15px", color: "#5a2575", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <span>📢</span> 運営からのお知らせ
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
            <h2 style={{ fontSize: "15px", color: "#2d3748", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <span>⏱</span> 各アトラクション情報
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
                  id={`sport-card-${sport.id}`}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: isExpanded ? "0 8px 24px rgba(90, 37, 117, 0.08)" : "0 4px 12px rgba(0,0,0,0.03)",
                    border: isExpanded ? "2px solid #5a2575" : "1px solid #e2e8f0",
                    padding: "16px",
                    position: "relative",
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
                        <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1a202c", margin: 0 }}>{sport.name}</h3>
                        <span style={{ fontSize: "10px", color: "#9f7aea", fontWeight: "600" }}>
                          {isExpanded ? "▲ 閉じる" : "▼ タップで詳細"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "8px" }}>
                        <span style={{ fontSize: "11px", backgroundColor: "#f7fafc", border: "1px solid #e2e8f0", padding: "3px 8px", borderRadius: "20px", color: "#4a5568", fontWeight: "600" }}>
                          📍 {sport.location}
                        </span>
                        <span style={{ fontSize: "11px", backgroundColor: bgLight, color: statusColor, padding: "3px 8px", borderRadius: "20px", fontWeight: "800" }}>
                          {statusText}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", zIndex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: "32px", fontWeight: "900", color: statusColor, lineHeight: "1" }}>
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
                    <div style={{ animation: "fadeIn 0.25s ease-out", position: "relative" }}>
                      
                      {/* ⚽ アトラクション詳細背景のデコレーション(sps.pngマスコットをうっすら配置) */}
                      <div style={{ position: "absolute", right: "-5px", top: "10px", opacity: 0.12, pointerEvents: "none" }}>
                        <Image 
                          src="/sps.png" 
                          alt="サッカー背景デコレーション" 
                          width={90} 
                          height={90} 
                          style={{ objectFit: "contain" }} 
                        />
                      </div>

                      {sport.description && (
                        <div style={{ 
                          marginTop: "14px", 
                          paddingTop: "14px", 
                          borderTop: "1px dashed #e2e8f0", 
                          fontSize: "12px", 
                          color: "#4a5568", 
                          lineHeight: "1.6",
                          position: "relative",
                          zIndex: 2
                        }}>
                          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{sport.description}</p>
                        </div>
                      )}

                      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #edf2f7", position: "relative", zIndex: 2 }}>
                        <span style={{ fontSize: "11px", fontWeight: "bold", color: "#5a2575", display: "block", marginBottom: "8px" }}>
                          💬 参加者のリアルな口コミ ({filteredReviews.length}件)
                        </span>
                        
                        {filteredReviews.length === 0 ? (
                          <p style={{ color: "#a0aec0", fontSize: "11px", margin: "4px 0 0 0", fontStyle: "italic" }}>
                            現在、この種目に関するつぶやきはありません。右下の＋ボタンから最初の声を届けてみよう！
                          </p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {filteredReviews.map((rev) => (
                              <div key={rev.id} style={{ backgroundColor: "#fdfbfe", padding: "12px", borderRadius: "10px", border: "1px solid #f5edf9" }}>
                                <p style={{ fontSize: "13px", color: "#2d3748", margin: "0 0 4px 0", lineHeight: "1.4", fontWeight: "500" }}>
                                  {rev.text}
                                </p>
                                <span style={{ fontSize: "9px", color: "#a0aec0", display: "block", marginBottom: "8px" }}>
                                  {formatTime(rev.createdAt)}
                                </span>

                                {/* 👍 リアクションエリア */}
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

                                {/* 💬 返信一覧 */}
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

                                {/* 💬 返信書き込み */}
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
        <section style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 15px rgba(90, 37, 117, 0.04)", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "15px", color: "#5a2575", fontWeight: "800", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>💬</span> みんなの最新のつぶやき
          </h2>
          {reviews.length === 0 ? (
            <p style={{ color: "#a0aec0", fontSize: "11px", margin: 0 }}>まだ投稿はありません。最初の声を届けよう！</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reviews.slice(0, 5).map((rev) => ( 
                <div key={rev.id} style={{ backgroundColor: "#fdfbfd", borderRadius: "10px", padding: "12px", border: "1px solid #f3ecf5" }}>
                  <p style={{ fontSize: "13px", color: "#2d3748", margin: "0 0 4px 0", lineHeight: "1.4", fontWeight: "500" }}>{rev.text}</p>
                  <span style={{ fontSize: "9px", color: "#a0aec0", display: "block", marginBottom: "8px" }}>{formatTime(rev.createdAt)}</span>

                  {/* 👍 リアクションエリア */}
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
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 🔮 右下にふわふわ浮かぶお助けナビゲーター (sps.pngを使用) */}
      <div style={{ 
        position: "fixed", 
        bottom: "32px", 
        right: "24px", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        gap: "4px",
        zIndex: 50,
        pointerEvents: "none"
      }}>
        <div style={{ 
          backgroundColor: "white", 
          padding: "6px 12px", 
          borderRadius: "12px", 
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)", 
          border: "1px solid #5a2575",
          fontSize: "10px",
          fontWeight: "bold",
          color: "#5a2575",
          whiteSpace: "nowrap"
        }}>
          マップの数字をタップしてみてね！
        </div>
        <div style={{ 
          position: "relative", 
          width: "55px", 
          height: "55px",
          animation: "float 3s ease-in-out infinite"
        }}>
          <Image 
            src="/sps.png" 
            alt="Guide Mascot" 
            fill
            style={{ objectFit: "contain" }}
          />
        </div>
        
        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
        `}</style>
      </div>

    </div>
  );
}