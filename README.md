# 明日から本気出す(仮)

### このアプリは、ユーザが入力した状況に対して、Gemini Aiが適切な言い訳を生成します。<br>ユーザは生成された言い訳を「成功」や「非表示」として管理でき、タグごとのランキングも確認できます。

<details>
<summary><strong>使い方</strong></summary>

1. Googleアカウントでログインしましょう<br>
<img alt="login" src="docs/images/login.png" width="800px"/>

2. まずはチャットの新規作成から始めます<br>
<img alt="newChat" src="docs/images/newChat.png" width="800px"/><br>

3. 状況を入力して「送信」ボタンをクリックすると、言い訳が生成されます<br>
<img alt="input" src="docs/images/excuseGenerator.png" width="800px"/><br>

4. 「成功」ボタンと「非表示」ボタンから生成された言い訳を管理できます<br>
    「成功一覧」ボタンと「非表示一覧」ボタンから、管理した言い訳を確認できます<br>
<img alt="excuseList" src="docs/images/successAndHidden.png" width="800px"/><br>

5. 「成功一覧」から言い訳を選択して、タグごとのランキングに反映しましょう<br>
<img alt="savaExcuses" src="docs/images/saveExcuses.png" width="800px"/><br>

6. タグ一覧から、タグごとのランキングが確認ができるようになります<br>
<img alt="tagRanking" src="docs/images/tagRanking.png" width="800px"/><br>

</details>

<details>
<summary><strong>作成理由 & 主な機能</strong></summary>

### 作成理由
AIを取り入れて、エンタメ性のあるアプリを作りたかった

### 主な機能
- ログイン機能
- チャットの新規作成機能
- Gemini APIを使用した言い訳生成機能
- 言い訳の管理機能（成功、非表示）
- タグ機能
- ランキング機能 & いいね機能
- レスポンシブデザイン

</details>

<details>

<summary><strong>技術スタック</strong></summary>

- 言語: TypeScript<br>
- フロントエンド: Next.js<br>
- バックエンド: Node.js, Express<br>
- データベース: Supabase<br>
- 認証: Firebase Authentication<br>
- AI: Gemini API<br>

</details>

