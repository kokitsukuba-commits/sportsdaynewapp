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

export default function AdminPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 種目追加フォーム用のステート
  const [newSportName, setNewSportName] = useState("");
  const [newSportLocation, setNewSportLocation] = useState("");
  const [newSportDescription, setNewSportDescription] = useState("");
  const [newSportWaitingTime, setNewSportWaitingTime] = useState(0);

  // 管理者専用パスコード（4桁のランダム数字）
  const ADMIN_PASSCODE = "5193";

  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(collection(db, "sports"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const sportsData: Sport[] = [];
      snapshot.forEach((doc) => {
        sportsData.push({ id: doc.id, ...doc.data() } as Sport);
      });
      setSports(sportsData);
    });

    return () => unsub();
  }, [isAuthenticated]);

  // ログイン処理
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
    } else {
      alert("❌ パスコードが違います。");
    }
  };

  // 新規種目の追加
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
      // フォームの初期化
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

  // 待ち時間の更新
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

  // 種目の削除
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

  // 認証前画面
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

  // 管理者操作画面
  return (
    <div style={{ backgroundColor: "#f7f9fc", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", paddingBottom: "60px" }}>
      <header style={{ backgroundColor: "#2d3748", color: "white", padding: "16px", textAlign: "center" }}>
        <h1 style={{ fontSize: "18px", margin: 0, fontWeight: "bold" }}>⚙️ 運営管理者用コントロールパネル</h1>
      </header>

      <main style={{ maxWidth: "550px", margin: "0 auto", padding: "20px 16px" }}>
        
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