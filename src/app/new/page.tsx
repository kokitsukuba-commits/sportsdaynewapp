"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function NewReviewPage() {
  const router = useRouter();
  const [newReviewText, setNewReviewText] = useState("");
  const [userPasscode, setUserPasscode] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");

  // 閲覧者の口コミ投稿用パスコード（4桁のランダム数字）
  const USER_PASSCODE = "8264";

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) {
      alert("口コミ内容を入力してください。");
      return;
    }

    if (userPasscode !== USER_PASSCODE) {
      alert("❌ パスコードが正しくありません。");
      return;
    }

    setReviewStatus("送信中...");
    try {
      await addDoc(collection(db, "reviews"), {
        text: newReviewText,
        createdAt: serverTimestamp(),
      });
      setNewReviewText("");
      setUserPasscode("");
      setReviewStatus("🎉 つぶやきを投稿しました！");

      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error(error);
      setReviewStatus("❌ 送信に失敗しました。");
    }
  };

  return (
    <div style={{ backgroundColor: "#f7f9fc", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <header style={{ backgroundColor: "#5a2575", color: "white", padding: "16px", display: "flex", alignItems: "center" }}>
        <button 
          onClick={() => router.back()} 
          style={{ background: "none", border: "none", color: "white", fontSize: "16px", cursor: "pointer", marginRight: "12px", display: "flex", alignItems: "center" }}
        >
          ← 戻る
        </button>
        <h1 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>新規つぶやき投稿</h1>
      </header>

      <main style={{ maxWidth: "450px", margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "15px", color: "#5a2575", fontWeight: "700", margin: "0 0 4px 0" }}>
            💬 つぶやきを投稿する
          </h2>
          <p style={{ fontSize: "11px", color: "#718096", margin: "0 0 16px 0", lineHeight: "1.4" }}>
            本文中に<strong>「種目名」</strong>を入れると、各アトラクションの詳細ページにも自動で表示されます！
          </p>

          <form onSubmit={handlePostReview} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#4a5568", display: "block", marginBottom: "6px" }}>つぶやき内容</label>
              <textarea
                placeholder="バブルサッカーめちゃくちゃ楽しかった！"
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
                rows={5}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e0",
                  fontSize: "13px",
                  resize: "none",
                  outline: "none",
                  color: "#1a202c",
                  backgroundColor: "white",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#4a5568", display: "block", marginBottom: "6px" }}>投稿用パスコード（数字4桁）</label>
              <input
                type="password"
                placeholder="4桁の数字を入力"
                value={userPasscode}
                onChange={(e) => setUserPasscode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e0",
                  fontSize: "13px",
                  outline: "none",
                  color: "#1a202c",
                  backgroundColor: "white",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#5a2575",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "14px",
                marginTop: "10px"
              }}
            >
              投稿を送信する
            </button>
          </form>

          {reviewStatus && (
            <p style={{ marginTop: "16px", fontWeight: "bold", color: "#5a2575", textAlign: "center", fontSize: "13px" }}>
              {reviewStatus}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}