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
  setDoc,
  addDoc,
} from "firebase/firestore";

interface Sport {
  id: string;
  name: string;
  waitingTime: number;
  location: string;
  description?: string;
  updatedAt: any;
}

// 🎯 最新の種目・会場定義（page_id=2951 準拠）
const LATEST_SPORTS = [
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

export default function AdminPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qSports = query(collection(db, "sports"), orderBy("name", "asc"));
    const unsubSports = onSnapshot(qSports, (snapshot) => {
      const sportsData: Sport[] = [];
      snapshot.forEach((docSnap) => {
        sportsData.push({ ...docSnap.data(), id: docSnap.id } as Sport);
      });
      setSports(sportsData);
      setLoading(false);
    });

    return () => unsubSports();
  }, []);

  // 待ち時間の更新
  const handleUpdateWaitingTime = async (id: string, newTime: number) => {
    try {
      const sportRef = doc(db, "sports", id);
      await updateDoc(sportRef, {
        waitingTime: newTime,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("更新エラー:", error);
      alert("❌ 待ち時間の更新に失敗しました。");
    }
  };

  // お知らせの投稿
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;

    try {
      await addDoc(collection(db, "announcements"), {
        title: announcementTitle,
        content: announcementContent,
        createdAt: new Date(),
      });
      setAnnouncementTitle("");
      setAnnouncementContent("");
      alert("✅ お知らせを公開しました！");
    } catch (error) {
      console.error("お知らせ投稿エラー:", error);
      alert("❌ お知らせの投稿に失敗しました。");
    }
  };

  // 一括で最新種目データをFirestoreにセット・初期化するボタン
  const handleInitializeSports = async () => {
    if (!confirm("Firestoreの種目リストを最新の9種目で初期化・作成しますか？")) return;

    try {
      for (const sport of LATEST_SPORTS) {
        const sportRef = doc(db, "sports", sport.name);
        await setDoc(
          sportRef,
          {
            name: sport.name,
            location: sport.location,
            waitingTime: 0,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }
      alert("✅ 最新の種目・会場データを正常にセットしました！");
    } catch (error) {
      console.error("種目初期化エラー:", error);
      alert("❌ 種目データの初期化に失敗しました。");
    }
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
        管理者画面を読み込み中...
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#fbfbfe",
        minHeight: "100vh",
        fontFamily: fontStyle,
        paddingBottom: "60px",
        color: "#2d3748",
      }}
    >
      <header
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)",
          color: "white",
          padding: "20px 16px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
            🛠 Tsukuba Sports Day 管理画面
          </h1>
          <Link
            href="/"
            style={{
              color: "white",
              fontSize: "12px",
              textDecoration: "underline",
            }}
          >
            ← ユーザー画面へ
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
        {/* 種目データの一括初期化ボタン */}
        <section
          style={{
            backgroundColor: "#f3e8ff",
            border: "2px solid #c084fc",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#6b21a8", margin: "0 0 8px 0" }}>
            🔄 種目データのセット・更新
          </h2>
          <p style={{ fontSize: "11px", color: "#581c87", marginBottom: "12px" }}>
            ボタンを押すと、データベース上に新種目9件の初期データが作成・統合されます。
          </p>
          <button
            onClick={handleInitializeSports}
            style={{
              backgroundColor: "#6b21a8",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            新種目データをDBに一括登録/更新
          </button>
        </section>

        {/* お知らせ投稿フォーム */}
        <section
          style={{
            backgroundColor: "white",
            border: "1.5px solid #e2e8f0",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "15px", fontWeight: "bold", color: "#4c1d95", margin: "0 0 12px 0" }}>
            📢 運営お知らせの新規投稿
          </h2>
          <form onSubmit={handlePostAnnouncement} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
              type="text"
              placeholder="タイトル (例: 雨天時の対応について)"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1.5px solid #cbd5e1",
                fontSize: "12px",
                outline: "none",
              }}
            />
            <textarea
              placeholder="お知らせ内容を入力..."
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              rows={3}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1.5px solid #cbd5e1",
                fontSize: "12px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px",
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              お知らせを公開
            </button>
          </form>
        </section>

        {/* 各種目の待ち時間管理 */}
        <section>
          <h2 style={{ fontSize: "15px", fontWeight: "bold", color: "#4c1d95", marginBottom: "12px" }}>
            ⏱ 待ち時間の変更（リアルタイム更新）
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sports.map((sport) => (
              <div
                key={sport.id}
                style={{
                  backgroundColor: "white",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 2px 0" }}>
                    {sport.name}
                  </h3>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>
                    📍 {sport.location}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {[0, 5, 10, 15, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleUpdateWaitingTime(sport.id, mins)}
                      style={{
                        backgroundColor:
                          sport.waitingTime === mins ? "#6b21a8" : "#f1f5f9",
                        color: sport.waitingTime === mins ? "white" : "#475569",
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px 8px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      {mins}分
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}