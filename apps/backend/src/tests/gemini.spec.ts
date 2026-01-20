// gemini.spec.ts は gemini/initialization(.mock).ts と
// excuse/generateExcuse(.mock).ts を統合したサービス（services/geminiService.ts）の
// 挙動を検証するためのテストです。

// 目的: Gemini 呼び出しラッパーの再試行やエラーハンドリングをユニットテストする。HTTP クライアントの失敗時にリトライされることを確認する。
// 方針: node-fetch をモックして失敗→成功のシナリオを作る。

