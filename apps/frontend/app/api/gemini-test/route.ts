export async function GET() {
    console.log("Next.js API route /api/gemini-test called");
    try {
        const res = await fetch("http://localhost:3001/api/gemini-test");
        console.log("バックエンドレスポンス:", res.status);
        if (!res.ok) throw new Error("バックエンドAPIの呼び出し失敗");
        const data = await res.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } catch (error) {
        console.error("APIプロキシエラー", error);
        return new Response(JSON.stringify({ error: "API呼び出し失敗" }), { status: 500 });
    }
}
