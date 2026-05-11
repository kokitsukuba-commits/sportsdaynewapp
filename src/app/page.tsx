"use client";

import React, { useState } from "react";

// ==========================================
// 1. 型定義
// ==========================================
interface SportEvent {
  id: string;
  name: string;
  waitTime: number; // 待ち時間（分）
  status: "受付中" | "混雑" | "受付終了" | "一時中断";
  location: string;
  mapX: number; // マップ上のX座標 (%)
  mapY: number; // マップ上のY座標 (%)
  rules: string;
}

interface Review {
  id: number;
  sportId: string;
  user: string;
  text: string;
  time: string;
}

// ==========================================
// 2. 初期データ
// ==========================================
const INITIAL_EVENTS: SportEvent[] = [
  {
    id: "bubble",
    name: "バブルサッカー ⚽️",
    waitTime: 20,
    status: "受付中",
    location: "第1サッカー場",
    mapX: 30,
    mapY: 45,
    rules: "1チーム3名、試合時間4分。バブルを身につけて押し合いながらゴールを目指そう！",
  },
  {
    id: "ninetag",
    name: "9マスタグ 🏃‍♂️",
    waitTime: 5,
    status: "受付中",
    location: "中央体育館",
    mapX: 65,
    mapY: 30,
    rules: "3x3のエリアで鬼ごっこ！相手の動きを予測して素早く逃げ切ろう！",
  },
  {
    id: "pose",
    name: "ポーズ合わせゲーム 🧘‍♀️",
    waitTime: 40,
    status: "混雑",
    location: "武道館",
    mapX: 50,
    mapY: 75,
    rules: "お題に合わせてチーム全員で同じポーズを決めよう！一致度で競います。",
  },
];

const INITIAL_REVIEWS: Review[] = [
  { id: 1, sportId: "bubble", user: "つくば太郎", text: "バブルサッカー、ぶつかり合うのがめちゃくちゃ爽快だった！体験する価値アリ！", time: "10分前" },
  { id: 2, sportId: "ninetag", user: "やまと", text: "9マスタグ、頭脳戦でかなり息が上がりました。回転が早いからすぐ遊べる！", time: "25分前" },
];

export default function Page() {
  // --- ステート管理 ---
  const [events, setEvents] = useState<SportEvent[]>(INITIAL_EVENTS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [activeTab, setActiveTab] = useState<"user" | "admin">("user");
  const [selectedSportId, setSelectedSportId] = useState<string>("bubble");

  // 一般ユーザー向け投稿用
  const [reviewUser, setReviewUser] = useState("");
  const [reviewText, setReviewText] = useState("");

  // 管理者モード認証用
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [passcode, setPasscode] = useState("");
  
  // ポップアップ通知
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ==========================================
  // 3. 各種ハンドラー
  // ==========================================
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 口コミ投稿
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewUser.trim() || !reviewText.trim()) return;

    const newReview: Review = {
      id: Date.now(),
      sportId: selectedSportId,
      user: reviewUser,
      text: reviewText,
      time: "たった今",
    };

    setReviews([newReview, ...reviews]);
    setReviewUser("");
    setReviewText("");
    showToast("口コミを投稿したよ！みんなに共有されました 📣");
  };

  // 口コミ通報
  const handleReportReview = (id: number, user: string) => {
    showToast(`${user} さんの投稿を通報しました。運営が確認します。👮`);
  };

  // 管理者パスコードチェック（★5193にアップデート！）
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "5193") {
      setIsAdminLoggedIn(true);
      showToast("管理者モードでログインしました 🛠️");
    } else {
      showToast("パスコードが違います ❌");
    }
  };

  // 待ち時間の更新 (管理者)
  const handleUpdateWaitTime = (id: string, delta: number) => {
    setEvents(events.map(event => {
      if (event.id === id) {
        const newTime = Math.max(0, event.waitTime + delta);
        return { ...event, waitTime: newTime, status: newTime >= 30 ? "混雑" : "受付中" };
      }
      return event;
    }));
  };

  // ステータスの更新 (管理者)
  const handleUpdateStatus = (id: string, status: SportEvent["status"]) => {
    setEvents(events.map(event => {
      if (event.id === id) {
        return { ...event, status };
      }
      return event;
    }));
    showToast("ステータスを更新しました！");
  };

  return (
    <div style={{
      backgroundColor: "#FFF9F5",
      minHeight: "100vh",
      fontFamily: "'Noto Sans JP', sans-serif",
      color: "#5D4037",
      padding: "20px 16px 40px 16px",
      boxSizing: "border-box",
    }}>
      {/* ヘッダー */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        paddingBottom: "12px",
        borderBottom: "3px dashed #FFD1D1",
      }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "950", color: "#FF9AA2", margin: 0, letterSpacing: "1px" }}>
            🎒 つくば Sports Day
          </h1>
          <p style={{ fontSize: "11px", color: "#885A5A", margin: "2px 0 0 0", fontWeight: "bold" }}>
            リアルタイム混雑・待ち時間案内アプリ
          </p>
        </div>

        {/* ユーザー / 管理者 切り替え */}
        <div style={{
          backgroundColor: "#FFE5E5",
          borderRadius: "20px",
          padding: "3px",
          display: "flex",
        }}>
          <button
            onClick={() => { setActiveTab("user"); }}
            style={{
              padding: "6px 12px",
              border: "none",
              borderRadius: "17px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              backgroundColor: activeTab === "user" ? "#FF9AA2" : "transparent",
              color: activeTab === "user" ? "white" : "#885A5A",
            }}
          >
            ユーザー
          </button>
          <button
            onClick={() => { setActiveTab("admin"); }}
            style={{
              padding: "6px 12px",
              border: "none",
              borderRadius: "17px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              backgroundColor: activeTab === "admin" ? "#FF9AA2" : "transparent",
              color: activeTab === "admin" ? "white" : "#885A5A",
            }}
          >
            運営
          </button>
        </div>
      </header>

      {/* ==========================================
          A. 一般ユーザー画面
          ========================================== */}
      {activeTab === "user" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* 1. 会場マップ（待ち時間ピン重ね表示） */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "28px",
            padding: "16px",
            border: "3px solid #FFDAC1",
            boxShadow: "0 8px 20px rgba(255, 183, 178, 0.2)",
          }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 12px 0", color: "#885A5A" }}>
              🗺️ リアルタイム混雑マップ
            </h2>
            <div style={{
              position: "relative",
              width: "100%",
              height: "220px",
              backgroundColor: "#E2F0D9",
              borderRadius: "20px",
              overflow: "hidden",
              border: "2px solid #FFDAC1",
            }}>
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#88A676",
                fontSize: "13px",
                fontWeight: "bold",
                backgroundImage: "radial-gradient(#C6E0B4 20%, transparent 20%)",
                backgroundSize: "20px 20px",
              }}>
                筑波大学 陸上競技場・体育館エリア
              </div>

              {/* マップに重ねるイベントピン */}
              {events.map(event => (
                <div
                  key={event.id}
                  onClick={() => setSelectedSportId(event.id)}
                  style={{
                    position: "absolute",
                    left: `${event.mapX}%`,
                    top: `${event.mapY}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: event.status === "受付終了" ? "#9E9E9E" : event.status === "混雑" ? "#FF9AA2" : "#B5EAD7",
                    color: event.status === "受付終了" || event.status === "混雑" ? "white" : "#4A5D4E",
                    padding: "6px 12px",
                    borderRadius: "16px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                    border: "2px solid white",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.0)"}
                >
                  <div>{event.name.split(" ")[0]}</div>
                  <div style={{ fontSize: "9px" }}>
                    {event.status === "受付終了" ? "終了" : `${event.waitTime}分`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 待ち時間一覧カード */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: "0", color: "#885A5A" }}>
              ⏳ 現在の待ち時間一覧
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
              {events.map(event => {
                const isSelected = selectedSportId === event.id;
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedSportId(event.id)}
                    style={{
                      backgroundColor: "white",
                      borderRadius: "24px",
                      padding: "16px",
                      border: isSelected ? "3px solid #FF9AA2" : "3px solid #FFDAC1",
                      cursor: "pointer",
                      boxShadow: isSelected ? "0 8px 16px rgba(255, 154, 162, 0.3)" : "0 4px 10px rgba(0,0,0,0.02)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "8px" }}>{event.name}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "28px", fontWeight: "950", color: "#FF9AA2" }}>{event.waitTime}</span>
                      <span style={{ fontSize: "12px", color: "#888" }}>分待ち</span>
                    </div>
                    <span style={{
                      backgroundColor: event.status === "受付中" ? "#E8F5E9" : event.status === "混雑" ? "#FFEBEE" : "#ECEFF1",
                      color: event.status === "受付中" ? "#2E7D32" : event.status === "混雑" ? "#C62828" : "#37474F",
                      fontSize: "11px",
                      fontWeight: "bold",
                      padding: "3px 8px",
                      borderRadius: "10px",
                    }}>
                      {event.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. 選択された種目の詳細＆つぶやき・口コミ */}
          {selectedSportId && (
            <div style={{
              backgroundColor: "white",
              borderRadius: "28px",
              padding: "20px",
              border: "3px solid #FFDAC1",
              boxShadow: "0 8px 20px rgba(255, 183, 178, 0.2)",
            }}>
              {events.filter(e => e.id === selectedSportId).map(selectedSport => (
                <div key={selectedSport.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, color: "#885A5A" }}>
                      📢 {selectedSport.name} のルールと情報
                    </h3>
                    <span style={{ fontSize: "12px", color: "#888", fontWeight: "bold" }}>📍 {selectedSport.location}</span>
                  </div>
                  <p style={{
                    fontSize: "13px",
                    lineHeight: "1.6",
                    backgroundColor: "#FFF9F5",
                    padding: "12px",
                    borderRadius: "16px",
                    margin: "0 0 20px 0",
                    borderLeft: "4px solid #FFB7B2"
                  }}>
                    {selectedSport.rules}
                  </p>

                  {/* 口コミ表示 */}
                  <h4 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 10px 0", color: "#885A5A" }}>
                    💬 みんなのつぶやき・口コミ ({reviews.filter(r => r.sportId === selectedSportId).length}件)
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                    {reviews.filter(r => r.sportId === selectedSportId).length === 0 ? (
                      <p style={{ fontSize: "12px", color: "#aaa", textAlign: "center", margin: "10px 0" }}>まだ口コミがありません。最初のつぶやきを投稿しよう！</p>
                    ) : (
                      reviews.filter(r => r.sportId === selectedSportId).map(review => (
                        <div key={review.id} style={{
                          backgroundColor: "#FFF9F5",
                          borderRadius: "16px",
                          padding: "12px",
                          fontSize: "13px",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontWeight: "bold", color: "#885A5A" }}>👤 {review.user}</span>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <span style={{ fontSize: "10px", color: "#888" }}>{review.time}</span>
                              <button
                                onClick={() => handleReportReview(review.id, review.user)}
                                style={{ background: "none", border: "none", color: "#FF9AA2", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}
                              >
                                ⚠️ 通報
                              </button>
                            </div>
                          </div>
                          <p style={{ margin: 0, lineHeight: "1.5" }}>{review.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 口コミ投稿フォーム */}
                  <form onSubmit={handleAddReview} style={{
                    borderTop: "2px dashed #FFD1D1",
                    paddingTop: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        type="text"
                        placeholder="ニックネーム"
                        value={reviewUser}
                        onChange={(e) => setReviewUser(e.target.value)}
                        required
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          borderRadius: "15px",
                          border: "none",
                          backgroundColor: "#FFF0F5",
                          fontSize: "13px",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="「待ち時間なし！」「今すいてるよー」などつぶやく..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        required
                        style={{
                          flex: 3,
                          padding: "10px 14px",
                          borderRadius: "15px",
                          border: "none",
                          backgroundColor: "#FFF0F5",
                          fontSize: "13px",
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          backgroundColor: "#FF9AA2",
                          color: "white",
                          border: "none",
                          borderRadius: "15px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          fontSize: "13px",
                          boxShadow: "0 4px 10px rgba(255, 154, 162, 0.3)",
                        }}
                      >
                        送信 🚀
                      </button>
                    </div>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          B. 運営・管理者画面
          ========================================== */}
      {activeTab === "admin" && (
        <div style={{
          backgroundColor: "white",
          borderRadius: "28px",
          padding: "20px",
          border: "3px solid #FFDAC1",
          boxShadow: "0 8px 20px rgba(255, 183, 178, 0.2)",
          maxWidth: "500px",
          margin: "0 auto",
        }}>
          {!isAdminLoggedIn ? (
            // パスコードログイン画面
            <form onSubmit={handleAdminLogin} style={{ textAlign: "center", padding: "20px 0" }}>
              <span style={{ fontSize: "40px" }}>🔑</span>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "12px 0", color: "#885A5A" }}>
                運営スタッフ専用ダッシュボード
              </h3>
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "20px" }}>
                ※設定したパスコードでログインしてください
              </p>
              <input
                type="password"
                placeholder="パスコードを入力"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "15px",
                  border: "none",
                  backgroundColor: "#FFF0F5",
                  marginBottom: "16px",
                  textAlign: "center",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="submit"
                style={{
                  width: "100%",
                  backgroundColor: "#FF9AA2",
                  color: "white",
                  border: "none",
                  borderRadius: "15px",
                  padding: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(255, 154, 162, 0.3)",
                }}
              >
                ログインする 🔓
              </button>
            </form>
          ) : (
            // 管理パネル本体
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px dashed #FFD1D1", paddingBottom: "10px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, color: "#885A5A" }}>
                  🛠️ 待ち時間・状況の一括更新
                </h3>
                <button
                  onClick={() => { setIsAdminLoggedIn(false); setPasscode(""); }}
                  style={{
                    backgroundColor: "#ECEFF1",
                    border: "none",
                    borderRadius: "10px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    cursor: "pointer",
                    color: "#555",
                  }}
                >
                  ログアウト 🚪
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {events.map(event => (
                  <div key={event.id} style={{
                    backgroundColor: "#FFF9F5",
                    padding: "16px",
                    borderRadius: "20px",
                    border: "1.5px solid #FFDAC1",
                  }}>
                    <div style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "12px", color: "#885A5A" }}>
                      {event.name} ({event.location})
                    </div>
                    
                    {/* 待ち時間調整コントロール */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "13px", color: "#666" }}>待ち時間:</span>
                      <button
                        onClick={() => handleUpdateWaitTime(event.id, -10)}
                        style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", backgroundColor: "#FFD1D1", color: "#885A5A", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleUpdateWaitTime(event.id, -5)}
                        style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", backgroundColor: "#FFD1D1", color: "#885A5A", fontWeight: "bold", fontSize: "14px", cursor: "pointer" }}
                      >
                        -5
                      </button>
                      <span style={{ fontSize: "20px", fontWeight: "950", minWidth: "50px", textAlign: "center", color: "#FF9AA2" }}>
                        {event.waitTime}分
                      </span>
                      <button
                        onClick={() => handleUpdateWaitTime(event.id, 5)}
                        style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", backgroundColor: "#FF9AA2", color: "white", fontWeight: "bold", fontSize: "14px", cursor: "pointer" }}
                      >
                        +5
                      </button>
                      <button
                        onClick={() => handleUpdateWaitTime(event.id, 10)}
                        style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", backgroundColor: "#FF9AA2", color: "white", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}
                      >
                        +10
                      </button>
                    </div>

                    {/* ステータス一括切替 */}
                    <div style={{ display: "flex", gap: "6px" }}>
                      {(["受付中", "混雑", "受付終了", "一時中断"] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(event.id, status)}
                          style={{
                            flex: 1,
                            padding: "6px 2px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                            backgroundColor: event.status === status ? "#FF9AA2" : "#EBEBEB",
                            color: event.status === status ? "white" : "#666",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          共通トースト通知ポップアップ
          ========================================== */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#FFFDF9",
          border: "2px solid #FF9AA2",
          borderRadius: "20px",
          padding: "12px 24px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <span style={{ fontSize: "13px", fontWeight: "bold", color: "#885A5A" }}>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ border: "none", background: "none", cursor: "pointer", fontWeight: "bold", color: "#885A5A" }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}