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
  where,
  doc,
  updateDoc,
  arrayUnion,
  increment,
  setDoc,
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

// 初期種目リスト（`page_id=2951` に準拠した種目名および会場）
const INITIAL_SPORTS = [
  { name: "サバイバルゲーム", location: "中央体育館 武道場" },
  { name: "フリーダムドッジボール", location: "中央体育館 バスケットコートA" },
  { name: "スピード3種対決", location: "中央体育館 バスケットコートB" },
  { name: "イントロドン", location: "中央体育館 第一ダンス場" },
  { name: "9マス鬼ごっこ", location: "中央体育館 ピロティー" },
  { name: "ダーツ", location: "中央体育館 ピロティー" },
  { name: "モルック", location: "中央体育館前 芝生エリア" },
  { name: "足つぼPK", location: "中央体育館前 芝生エリア" },
  { name: "ゴールボール", location: "中央体育館 体操場" },
];

const REACTION_EMOJIS = [
  { key: "like", emoji: "👍" },
  { key: "love", emoji: "❤️" },
  { key: "laugh", emoji: "😆" },
  { key: "sad", emoji: "😭" },
  { key: "fire", emoji: "🔥" },
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
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    // 閲覧数のカウントアップ
    const trackPageview = async () => {
      try {
        const statsRef = doc(db, "analytics", "pageviews");
        await setDoc(
          statsRef,
          { count: increment(1), lastViewedAt: new Date() },
          { merge: true }
        );
      } catch (error) {
        // スルー
      }
    };
    trackPageview();

    // 種目データの取得
    const qSports = query(collection(db, "sports"), orderBy("name", "asc"));
    const unsubSports = onSnapshot(qSports, (snapshot) => {
      const sportsData: Sport[] = [];
      snapshot.forEach((docSnap) => {
        sportsData.push({ ...docSnap.data(), id: docSnap.id } as Sport);
      });
      setSports(sportsData);
    });

    // お知らせデータの取得
    const qAnnouncements = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc")
    );
    const unsubAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      const announcementsData: Announcement[] = [];
      snapshot.forEach((docSnap) => {
        announcementsData.push({
          ...docSnap.data(),
          id: docSnap.id,
        } as Announcement);
      });
      setAnnouncements(announcementsData);
    });

    // 🔒 未アーカイブの投稿のみ取得（過去データはDBに保持・蓄積して非表示化）
    const qReviews = query(
      collection(db, "reviews"),
      where("archived", "!=", true),
      orderBy("archived"),
      orderBy("createdAt", "desc")
    );

    const unsubReviews = onSnapshot(
      qReviews,
      (snapshot) => {
        const reviewsData: Review[] = [];
        snapshot.forEach((docSnap) => {
          reviewsData.push({ ...docSnap.data(), id: docSnap.id } as Review);
        });
        setReviews(reviewsData);
        setLoading(false);
      },
      () => {
        // クライアント側フォールバックフィルター
        const qFallback = query(
          collection(db, "reviews"),
          orderBy("createdAt", "desc")
        );
        onSnapshot(qFallback, (snapshot) => {
          const reviewsData: Review[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data.archived) {
              reviewsData.push({ ...data, id: docSnap.id } as Review);
            }
          });
          setReviews(reviewsData);
          setLoading(false);
        });
      }
    );

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
        createdAt: new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      await updateDoc(reviewRef, {
        replies: arrayUnion(newReply),
      });
      setReplyInputs((prev) => ({ ...prev, [reviewId]: "" }));
    } catch (error) {
      console.error(error);
      alert("❌ 返信の送信に失敗しました。");
    }
  };

  const handleAddReaction = async (
    reviewId: string,
    reactionKey: keyof Reactions
  ) => {
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      const review = reviews.find((r) => r.id === reviewId);
      if (!review) return;

      const currentReactions = review.reactions || {};
      const currentCount = currentReactions[reactionKey] || 0;

      await updateDoc(reviewRef, {
        [`reactions.${reactionKey}`]: currentCount + 1,
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

  const fontStyle =
    "'Hiragino Maru Gothic ProN', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif";

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontStyle,
          color: "#4c1d95",
          backgroundColor: "#f5f3ff",
        }}
      >
        読み込み中...
      </div>
    );
  }

  // 表示する種目データ（Firestoreにデータがない場合は初期種目リストを使用）
  const displaySports =
    sports.length > 0
      ? sports
      : INITIAL_SPORTS.map((s, idx) => ({
          id: `default-${idx}`,
          name: s.name,
          waitingTime: 0,
          location: s.location,
          description: "",
          updatedAt: new Date(),
        }));

  return (
    <div
      style={{
        backgroundColor: "#fbfbfe",
        minHeight: "100vh",
        fontFamily: fontStyle,
        position: "relative",
        paddingBottom: "110px",
        color: "#2d3748",
      }}
    >
      {/* ヘッダー */}
      <header
        style={{
          background: "linear-gradient(135deg, #6b21a8 0%, #4c1d95 100%)",
          color: "white",
          padding: "20px 16px",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(76, 29, 149, 0.15)",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.reload();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
            }}
          >
            <Image
              src="/unnamed.png"
              alt="Tsukuba Sports Day Logo"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
            />
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#ffffff",
                margin: 0,
              }}
            >
              Tsukuba Sports Day
            </h1>
          </a>

          <a
            href="https://www.instagram.com/spoday_tsukuba?igsh=ZXhpZm05eXExdXdu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "6px 12px",
              backgroundColor: "#a3e635",
              color: "#4c1d95",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            📸 Instagram
          </a>
        </div>
      </header>

      {/* メインエリア */}
      <main
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "16px",
        }}
      >
        {/* 会場マップ画像エリア（あとからマップ画像を差し込めるプレースホルダー） */}
        <section style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#4c1d95",
              marginBottom: "10px",
            }}
          >
            🗺️ 会場エリアマップ
          </h2>
          <div
            style={{
              position: "relative",
              borderRadius: "16px",
              overflow: "hidden",
              border: "2px dashed #a855f7",
              backgroundColor: "#f3e8ff",
              minHeight: "350px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* マップ画像が準備できたら下記のコメントアウトを解除して src="/map.jpg" などを指定できます */}
            {/* 
            <img
              src="/map.jpg"
              alt="会場マップ"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            */}
            <div style={{ textAlign: "center", padding: "20px", color: "#6b21a8" }}>
              <p style={{ fontSize: "28px", margin: "0 0 8px 0" }}>🗺️</p>
              <p style={{ fontSize: "14px", fontWeight: "bold", margin: 0 }}>
                会場マップ（準備中）
              </p>
              <p style={{ fontSize: "11px", color: "#9333ea", marginTop: "4px" }}>
                ※画像ファイルを設置後、ここに自動描画されます
              </p>
            </div>

            {/* 種目ピンの動的描画スペース */}
            {displaySports.map((sport) => {
              let pinBg = "#84cc16";
              if (sport.waitingTime > 20) pinBg = "#ef4444";
              else if (sport.waitingTime > 0) pinBg = "#f97316";

              let position = { top: "50%", left: "50%" };
              const name = sport.name;

              if (name.includes("サバイバルゲーム")) position = { top: "25%", left: "30%" };
              else if (name.includes("フリーダムドッジボール")) position = { top: "25%", left: "70%" };
              else if (name.includes("スピード3種対決")) position = { top: "45%", left: "30%" };
              else if (name.includes("イントロドン")) position = { top: "45%", left: "70%" };
              else if (name.includes("9マス鬼ごっこ")) position = { top: "65%", left: "30%" };
              else if (name.includes("ダーツ")) position = { top: "65%", left: "70%" };
              else if (name.includes("モルック")) position = { top: "85%", left: "30%" };
              else if (name.includes("足つぼPK")) position = { top: "85%", left: "70%" };
              else if (name.includes("ゴールボール")) position = { top: "50%", left: "50%" };

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
                    padding: "4px 8px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  {sport.name} ({sport.waitingTime}分)
                </button>
              );
            })}
          </div>
        </section>

        {/* お知らせ */}
        {announcements.length > 0 && (
          <section
            style={{
              backgroundColor: "#ffffff",
              border: "2px solid #e9d8fd",
              borderRadius: "16px",
              padding: "12px 16px",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#6b21a8",
                margin: "0 0 8px 0",
              }}
            >
              📢 運営からのお知らせ
            </h3>
            {announcements.map((ann) => (
              <div
                key={ann.id}
                style={{
                  fontSize: "12px",
                  color: "#4b5563",
                  marginBottom: "4px",
                }}
              >
                <strong>{ann.title}</strong>: {ann.content}
              </div>
            ))}
          </section>
        )}

        {/* ⏱ 各アトラクション情報 */}
        <section style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#4c1d95",
              marginBottom: "12px",
            }}
          >
            ⏱ 各アトラクション情報
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {displaySports.map((sport) => {
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
                    border: isExpanded ? "2.5px solid #6b21a8" : "1.5px solid #e2e8f0",
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
                          color: "#1e1b4b",
                        }}
                      >
                        {sport.name}
                      </h3>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>
                        📍 {sport.location}
                      </span>
                    </div>
                    <div
                      style={{
                        backgroundColor:
                          sport.waitingTime === 0
                            ? "#f0fdf4"
                            : sport.waitingTime > 20
                            ? "#fef2f2"
                            : "#fff7ed",
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

                  {isExpanded && (
                    <div
                      style={{
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px dashed #e2e8f0",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#4b5563",
                          marginBottom: "10px",
                        }}
                      >
                        {sport.description || "詳細情報は準備中です。"}
                      </p>
                      <div style={{ fontSize: "12px" }}>
                        <strong>💬 リアルタイムつぶやき ({sportReviews.length})</strong>
                        {sportReviews.map((rev) => (
                          <div
                            key={rev.id}
                            style={{
                              backgroundColor: "#faf5ff",
                              padding: "6px 10px",
                              borderRadius: "8px",
                              marginTop: "4px",
                            }}
                          >
                            {rev.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 💬 みんなのつぶやき */}
        <section>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#4c1d95",
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
                color: "#9ca3af",
                fontSize: "13px",
              }}
            >
              現在、表示できるつぶやきはありません。
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "12px 14px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <p style={{ fontSize: "13px", margin: "0 0 8px 0" }}>
                    {rev.text}
                  </p>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {REACTION_EMOJIS.map(({ key, emoji }) => {
                      const count = rev.reactions?.[key] || 0;
                      return (
                        <button
                          key={key}
                          onClick={() => handleAddReaction(rev.id, key)}
                          style={{
                            backgroundColor: "#f3e8ff",
                            border: "none",
                            borderRadius: "10px",
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
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* つぶやく浮遊ボタン */}
      <Link
        href="/new"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "#6b21a8",
          color: "white",
          borderRadius: "30px",
          padding: "12px 20px",
          fontSize: "14px",
          fontWeight: "bold",
          textDecoration: "none",
          boxShadow: "0 4px 12px rgba(107, 33, 168, 0.3)",
        }}
      >
        ✏️ つぶやく
      </Link>
    </div>
  );
}