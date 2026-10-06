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
  arrayUnion,
  increment,
  setDoc
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
  like?: number;
  love?: number;
  laugh?: number;
  sad?: number;
  fire?: number;
}

interface Review {
  id: string;
  text: string;
  createdAt: any;
  replies?: Reply[];
  reactions?: Reactions;
  archived?: boolean;
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
    const trackPageview = async () => {
      try {
        const statsRef = doc(db, "analytics", "pageviews");
        await setDoc(statsRef, {
          count: increment(1),
          lastViewedAt: new Date()
        }, { merge: true });
      } catch (error) {
        // エラーはハンドリングせずスルー
      }
    };
    trackPageview();

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

  // タイトルクリック時にページをリロードする関数
  const handleTitleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // 通常の画面遷移をキャンセル
    window.location.reload(); // ページを強制再読み込み
  };

  const fontStyle = "'Hiragino Maru Gothic ProN', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif";

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: fontStyle, backgroundColor: "#f5f3ff" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ border: "4px solid #e9d8fd", borderTop: "4px solid #7c3aed", borderRadius: "50%", width: "45px", height: "45px", animation: "spin 1s linear infinite", margin: "0 auto 15px auto" }}></div>
          <p style={{ fontWeight: "950", color: "#6b21a8", fontSize: "16px" }}>ワクワクを読み込み中...</p>
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
    <div style={{ backgroundColor: "#fbfbfe", minHeight: "100vh", fontFamily: fontStyle, position: "relative", paddingBottom: "110px", color: "#2d3748" }}>
      
      {/* ヘッダー */}
      <header style={{ 
        background: "linear-gradient(135deg, #6b21a8 0%, #4c1d95 100%)", 
        color: "white", 
        padding: "32px 16px 24px 16px", 
        textAlign: "center", 
        boxShadow: "0 6px 20px rgba(76, 29, 149, 0.15)", 
        borderRadius: "0 0 28px 28px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "-20px", left: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(163, 230, 53, 0.15)" }}></div>
        <div style={{ position: "absolute", bottom: "-30px", right: "-10px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(163, 230, 53, 0.1)" }}></div>

        <div style={{ 
            display: "flex",
            alignItems: "center",
          justifyContent: "center", 
          gap: "12px", 
          marginBottom: "12px"
        }}>
          <a
            href="https://www.stb.tsukuba.ac.jp/~spoday/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: "block",
              flexShrink: 0,
              cursor: "pointer",
              transition: "transform 0.1s ease",
              filter: `
                drop-shadow(-1.5px -1.5px 0 #4c1d95)
                drop-shadow(1.5px -1.5px 0 #4c1d95)
                drop-shadow(-1.5px 1.5px 0 #4c1d95)
                drop-shadow(1.5px 1.5px 0 #4c1d95)
                drop-shadow(3px 3px 0px #a3e635)
              `
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.92)"}
            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <Image
              src="/unnamed.png" 
              alt="Tsukuba Sports Day Logo"
              width={55}  
              height={55} 
              style={{ objectFit: "contain" }}
            />
          </a>

          {/* ⚡️ 変更点: Linkで囲み、クリック時に画面が再読み込みされるように設定 */}
          <Link href="/" onClick={handleTitleClick} style={{ textDecoration: "none" }}>
            <h1 style={{ 
              fontSize: "26px", 
              fontWeight: "950", 
                  margin: 0,
              letterSpacing: "1.5px", 
              color: "#ffffff",
              cursor: "pointer",
              textShadow: `
                -2px -2px 0 #4c1d95,  
                 2px -2px 0 #4c1d95,
                -2px  2px 0 #4c1d95,
                 2px  2px 0 #4c1d95,
                 4px  4px 0 #a3e635
              `
            }}>
                Tsukuba Sports Day
              </h1>
          </Link>
            </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", position: "relative", zIndex: 1 }}>
          <p style={{ 
            fontSize: "12px", 
            backgroundColor: "#a3e635", 
            color: "#4c1d95", 
            margin: "0 auto", 
            fontWeight: "950",
            padding: "5px 14px",
            borderRadius: "30px",
            display: "inline-block",
            boxShadow: "0 3px 0px #4d7c0f",
            border: "2px solid #4c1d95"
          }}>
            ⚡️ リアルタイム待ち時間 ＆ 会場ガイド
          </p>

          <a
            href="https://www.instagram.com/spoday_tsukuba?igsh=ZXhpZm05eXExdXdu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#ffffff",
              color: "#4c1d95",
              fontSize: "11px",
              fontWeight: "950",
              padding: "4px 12px",
              borderRadius: "20px",
              border: "2px solid #4c1d95",
              boxShadow: "0 3px 0px rgba(76, 29, 149, 0.25)",
              textDecoration: "none",
              cursor: "pointer",
              transition: "transform 0.1s ease"
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(2px)";
              e.currentTarget.style.boxShadow = "none";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(0px)";
              e.currentTarget.style.boxShadow = "0 3px 0px rgba(76, 29, 149, 0.25)";
            }}
          >
            <span>📸</span> 公式Instagram
          </a>
        </div>
      </header>

      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
        {/* 会場エリアマップ */}
        <section style={{ marginBottom: "20px" }}>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#166534",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            🗺️ 会場マップ
          </h2>
          <div
            style={{
              position: "relative",
              borderRadius: "16px",
              overflow: "hidden",
              border: "3px solid #bbf7d0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              backgroundColor: "#ffffff",
            }}
          >
            <Image
              src="/map.jpg"
              alt="会場マップ"
              width={600}
              height={400}
              style={{ width: "100%", height: "auto", display: "block" }}
            />

            {/* マップピンの動的配置 */}
            {sports.map((sport) => {
              let pinBg = "#84cc16";
              if (sport.waitingTime > 20) {
                pinBg = "#ef4444";
              } else if (sport.waitingTime > 0) {
                pinBg = "#f97316";
              }

              let position = { top: "50%", left: "50%" };
              const name = sport.name;
              const loc = sport.location;

              if (name.includes("サバイバルゲーム")) {
                position = { top: "35%", left: "30%" };
              } else if (name.includes("フリーダムドッジボール")) {
                position = { top: "35%", left: "50%" };
              } else if (name.includes("スピード3種対決")) {
                position = { top: "35%", left: "70%" };
              } else if (name.includes("イントロドン")) {
                position = { top: "50%", left: "35%" };
              } else if (name.includes("9マス鬼ごっこ")) {
                position = { top: "50%", left: "65%" };
              } else if (name.includes("ダーツ")) {
                position = { top: "68%", left: "30%" };
              } else if (name.includes("モルック")) {
                position = { top: "68%", left: "50%" };
              } else if (name.includes("足つぼPK")) {
                position = { top: "68%", left: "70%" };
              } else if (name.includes("ゴールボール")) {
                position = { top: "85%", left: "50%" };
              } else if (loc.includes("バスケ場")) {
                position = { top: "40%", left: "50%" };
              } else if (loc.includes("ピロティー")) {
                position = { top: "65%", left: "50%" };
              } else if (loc.includes("第一ダンス場")) {
                position = { top: "85%", left: "50%" };
              }

              return (
                <button
                  key={sport.id}
                  onClick={() => toggleExpand(sport.id)}
                  style={{
                    position: "absolute",
                    top: position.top,
                    left: position.left,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: pinBg,
                    color: "white",
                    border: "2px solid white",
                    borderRadius: "12px",
                    padding: "3px 8px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sport.name} ({sport.waitingTime}分)
                </button>
              );
            })}
          </div>
        </section>

        {/* お知らせ一覧 */}
        {announcements.length > 0 && (
          <section
            style={{
              backgroundColor: "#fef3c7",
              border: "2px solid #fde68a",
              borderRadius: "16px",
              padding: "12px 16px",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#92400e",
                margin: "0 0 8px 0",
              }}
            >
              📢 お知らせ
            </h3>
            {announcements.map((ann) => (
              <div
                key={ann.id}
                style={{
                  fontSize: "12px",
                  color: "#78350f",
                  marginBottom: "4px",
                }}
              >
                <strong>{ann.title}</strong>: {ann.content}
              </div>
            ))}
          </section>
        )}

        {/* 種目・アトラクション一覧 */}
        <section style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#166534",
              marginBottom: "12px",
            }}
          >
            ⏱ 待ち時間一覧
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {sports.map((sport) => {
              const isExpanded = expandedSportId === sport.id;
              const sportReviews = reviews.filter((r) =>
                r.text.includes(sport.name)
              );

              return (
                <div
                  id={`sport-card-${sport.id}`}
                  key={sport.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "14px 16px",
                    border: "2px solid #e2e8f0",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <div
                    onClick={() => toggleExpand(sport.id)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: "15px",
                          fontWeight: "bold",
                          margin: "0 0 4px 0",
                          color: "#0f172a",
                        }}
                      >
                        {sport.name}
                      </h3>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        📍 {sport.location}
                      </span>
                    </div>
                    <div
                      style={{
                        backgroundColor:
                          sport.waitingTime === 0
                            ? "#dcfce7"
                            : sport.waitingTime > 20
                            ? "#fee2e2"
                            : "#ffedd5",
                        color:
                          sport.waitingTime === 0
                            ? "#15803d"
                            : sport.waitingTime > 20
                            ? "#b91c1c"
                            : "#c2410c",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontWeight: "bold",
                        fontSize: "13px",
                      }}
                    >
                      {sport.waitingTime === 0
                        ? "すぐ遊べる！"
                        : `${sport.waitingTime}分待ち`}
                    </div>
                  </div>

                  {/* 詳細情報 */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px dashed #cbd5e1",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#334155",
                          marginBottom: "12px",
                          lineHeight: "1.5",
                        }}
                      >
                        {sport.description || "詳細情報は準備中です。"}
                      </p>

                      <div style={{ marginTop: "8px" }}>
                        <h4
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#475569",
                            marginBottom: "6px",
                          }}
                        >
                          💬 この種目のリアルタイムつぶやき
                        </h4>
                        {sportReviews.length === 0 ? (
                          <p style={{ fontSize: "11px", color: "#94a3b8" }}>
                            まだつぶやきはありません。
                          </p>
                        ) : (
                          sportReviews.map((rev) => (
                            <div
                              key={rev.id}
                              style={{
                                backgroundColor: "#f8fafc",
                                padding: "8px 10px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                marginBottom: "4px",
                              }}
                            >
                              {rev.text}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 💬 リアルタイムつぶやき */}
        <section>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#166534",
              marginBottom: "12px",
            }}
          >
            💬 みんなのつぶやき
          </h2>

          {reviews.length === 0 ? (
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "16px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              まだ投稿はありません。「＋つぶやく」から投稿してみよう！
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "14px 16px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        fontWeight: "bold",
                      }}
                    >
                      参加者
                    </span>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                      {formatTime(review.createdAt)}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "13px",
                      color: "#1e293b",
                      margin: "0 0 10px 0",
                      lineHeight: "1.4",
                    }}
                  >
                    {review.text}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      marginBottom: "8px",
                    }}
                  >
                    {REACTION_EMOJIS.map(({ key, emoji }) => {
                      const count = review.reactions?.[key] || 0;
                      return (
                        <button
                          key={key}
                          onClick={() => handleAddReaction(review.id, key)}
                          style={{
                            backgroundColor: "#f1f5f9",
                            border: "none",
                            borderRadius: "12px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          {emoji} {count > 0 && count}
                        </button>
                      );
                    })}
                  </div>

                  {review.replies && review.replies.length > 0 && (
                    <div
                      style={{
                        backgroundColor: "#f8fafc",
                        borderRadius: "8px",
                        padding: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      {review.replies.map((reply, idx) => (
                        <div
                          key={idx}
                          style={{ fontSize: "11px", color: "#475569" }}
                        >
                          💬 {reply.text}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      placeholder="返信を書く..."
                      value={replyInputs[review.id] || ""}
                      onChange={(e) =>
                        setReplyInputs({
                          ...replyInputs,
                          [review.id]: e.target.value,
                        })
                      }
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "11px",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={() => handlePostReply(review.id)}
                      style={{
                        backgroundColor: "#16a34a",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
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

      {/* ＋つぶやく 浮遊ボタン */}
      <Link
        href="/new"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "#16a34a",
          color: "white",
          borderRadius: "30px",
          padding: "12px 20px",
          fontSize: "14px",
          fontWeight: "bold",
          textDecoration: "none",
          boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        ✏️ つぶやく
      </Link>
    </div>
  );
}