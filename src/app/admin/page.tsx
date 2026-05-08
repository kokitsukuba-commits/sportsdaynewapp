'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [error, setError] = useState('');

  // 運営メンバーが入力する正しい管理者コード（ここを自由に変更してください）
  const CORRECT_ADMIN_CODE = 'tsuku2026';

  // お知らせ用のステート
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');

  // アトラクション混雑状況用のステート
  const [attractions, setAttractions] = useState<any[]>([]);

  // 1. 簡易ログイン処理
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCodeInput === CORRECT_ADMIN_CODE) {
      setIsAdmin(true);
      setError('');
      // ログイン成功時にアトラクション情報を取得
      fetchAttractions();
    } else {
      setError('管理者コードが正しくありません。');
    }
  };

  // 2. アトラクション一覧の取得
  const fetchAttractions = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'attractions'));
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttractions(list);
    } catch (err) {
      console.error(err);
    }
  };

  // 3. お知らせの投稿
  const handlePostNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsContent) return;

    try {
      await addDoc(collection(db, 'news'), {
        title: newsTitle,
        content: newsContent,
        createdAt: serverTimestamp()
      });
      alert('お知らせを投稿しました！');
      setNewsTitle('');
      setNewsContent('');
    } catch (err) {
      alert('投稿に失敗しました: ' + err);
    }
  };

  // 4. 混雑状況（待ち時間）の更新
  const handleUpdateWaitTime = async (id: string, newTime: number) => {
    try {
      const docRef = doc(db, 'attractions', id);
      await updateDoc(docRef, { waitTime: newTime });
      alert('待ち時間を更新しました！');
      fetchAttractions();
    } catch (err) {
      alert('更新に失敗しました: ' + err);
    }
  };

  // ログイン前の画面
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">運営管理者ログイン</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">管理者コード</label>
              <input
                type="password"
                value={adminCodeInput}
                onChange={(e) => setAdminCodeInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="コードを入力してください"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
            >
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ログイン後の管理画面
  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-3xl font-bold">スポーツデー 運営管理画面</h1>
          <button
            onClick={() => setIsAdmin(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            ログアウト
          </button>
        </div>

        {/* お知らせ投稿フォーム */}
        <section className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">① お知らせの新規投稿</h2>
          <form onSubmit={handlePostNews} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">タイトル</label>
              <input
                type="text"
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                className="mt-1 w-full border rounded p-2"
                placeholder="【重要】雨天によるスケジュール変更"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">内容</label>
              <textarea
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                className="mt-1 w-full border rounded p-2 h-24"
                placeholder="変更内容の詳細を入力してください。"
              />
            </div>
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              お知らせを配信
            </button>
          </form>
        </section>

        {/* アトラクション待ち時間更新フォーム */}
        <section className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">② アトラクション混雑状況の更新</h2>
          <div className="space-y-4">
            {attractions.length === 0 ? (
              <p className="text-gray-500 text-sm">アトラクションが登録されていません。（Firestoreの 'attractions' コレクションを確認してください）</p>
            ) : (
              attractions.map((attraction) => (
                <div key={attraction.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium text-lg">{attraction.name}</p>
                    <p className="text-sm text-gray-500">現在の待ち時間: {attraction.waitTime}分</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      defaultValue={attraction.waitTime}
                      id={`time-${attraction.id}`}
                      className="border rounded w-16 p-1 text-center"
                    />
                    <span className="text-sm">分</span>
                    <button
                      onClick={() => {
                        const input = document.getElementById(`time-${attraction.id}`) as HTMLInputElement;
                        handleUpdateWaitTime(attraction.id, Number(input.value));
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      更新
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}