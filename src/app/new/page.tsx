"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

// 🎯 最新の種目選択肢
const SPORT_OPTIONS = [
  "全体・その他",
  "サバイバルゲーム",
  "フリーダムドッジボール",
  "スピード3種対決",
  "イントロドン",
  "9マス鬼ごっこ",
  "ダーツ",
  "モルック",
  "足つぼPK",
  "ゴールボール",
];

export default function NewPostPage() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState(SPORT_OPTIONS[0]);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 選択した種目名をテキストに含めて投稿
      const fullText =
        selectedSport === "全体・その他"
          ? text.trim()
          : `【${selectedSport}】${text.trim()}`;

      await addDoc(collection(db, "reviews"), {
        text: fullText,
        createdAt: new Date(),
        archived: false,
        reactions: {
          like: 0,
          love: 0,
          laugh: 0,
          sad: 0,
          fire: 0,
        },
      });

      router.push("/");
    } catch (error) {
      console.error("投稿エラー:", error);
      alert("❌ 投稿の送信に失敗しました。");
      setIsSubmitting(false);
    }
  };

  const fontStyle =
    "'Hiragino Maru Gothic ProN', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif";

  return (
    <div
      style={{
        backgroundColor: "#fbfbfe",
        minHeight: "100vh",
        fontFamily: fontStyle,
        padding: "16px",
        color: "#2d3748",
      }}
    >
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        {/* ヘッダーナビ */}
        <div style={{ marginBottom: "20px" }}>
          <Link
            href="/"
            style={{
              color: "#6b21a8",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            ← キャンセル
          </Link>
        </div>

        <h1
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "#4c1d95",
            marginBottom: "16px",
          }}
        >
          ✏️ つぶやきを投稿する
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "20px",
            border: "1.5px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* 種目選択 */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "bold",
                color: "#475569",
                marginBottom: "6px",
              }}
            >
              対象アトラクション・エリア
            </label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1.5px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
                backgroundColor: "#ffffff",
              }}
            >
              {SPORT_OPTIONS.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          {/* つぶやき内容 */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "bold",
                color: "#475569",
                marginBottom: "6px",
              }}
            >
              つぶやき内容
            </label>
            <textarea
              placeholder="例: サバゲーの待ち列伸びてきた！ / モルックすぐ遊べます！"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={150}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1.5px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <span
              style={{
                fontSize: "10px",
                color: "#94a3b8",
                display: "block",
                textAlign: "right",
                marginTop: "4px",
              }}
            >
              {text.length}/150字
            </span>
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            style={{
              backgroundColor: text.trim() && !isSubmitting ? "#6b21a8" : "#cbd5e1",
              color: "white",
              border: "none",
              borderRadius: "24px",
              padding: "12px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: text.trim() && !isSubmitting ? "pointer" : "default",
            }}
          >
            {isSubmitting ? "送信中..." : "投稿する"}
          </button>
        </form>
      </div>
    </div>
  );
}