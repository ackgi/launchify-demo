# 🚀 Launchify（ローンチファイ）
**APIサービスのためのセキュアなマーケットプレイス**  
APIを「登録する・売る・使う」を一元的に実現します。

---

## 🌐 デモURL
🔗 [https://launchify-demo.vercel.app/](https://launchify-demo.vercel.app)

---

## 👤 デモアカウント
 Email: demo@example.com   
 Password: launchify_demo123 
---

## 📋 概要
**Launchify** は、APIクリエイターが自分のAPIを登録し、  
課金プランを設定して販売できる **APIマーケットプレイス** です。  

Next.js、Supabase、Clerk、Stripeを連携し、  
認証・課金・アクセス制御・RLSセキュリティを統合しています。

---

## 🧱 要件定義
| 区分 | 内容 |
|------|------|
| 目的 | API販売者（Creator）がAPIを登録・販売し、購入者（Buyer）が利用できる環境を構築する。 |
| 機能要件 | 認証（Clerk）・DB（Supabase）・課金（Stripe）・APIキー発行・RLSによるアクセス制御 |
| 非機能要件 | JWT連携の安全性・レスポンシブUI・スケーラブルな構成 |
| 成果物 | Vercel上にデプロイ可能なフルスタックSaaSテンプレート |

---

## ⚙️ 使用技術
| 分類 | 使用技術 |
|------|-----------|
| フロントエンド | Next.js 15（App Router）, React 19, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Lucide Icons |
| バックエンド | Supabase（PostgreSQL + RLS） |
| 認証 | Clerk（JWTテンプレート名：supabase） |
| 決済 | Stripe（Checkout, Webhook対応） |
| 開発環境 | Node.js 20 / pnpm / Vercel |
| デザイン | Figma / Canva |

---

## 🧩 主な機能
- 🔐 **ログイン／認証連携**（Clerk × Supabase JWT）  
- 💳 **課金管理**（サブスク・前払い・従量課金の3モデル）  
- 📦 **プラン管理**（作成／編集／削除）  
- 🧠 **RLSによるデータアクセス制御**（作成者本人のみ閲覧・編集可）  
- 📈 **ダッシュボード**（API利用状況の可視化）  
- 🎨 **UI/UX**（shadcn/ui + Tailwindによるモダンなデザイン）  
- ⚙️ **デプロイ統合**（Vercel + Supabase + Stripe webhook）

---

## 🔗 外部サービス
| サービス | 用途 | 実装内容 |
|-----------|------|-----------|
| **Clerk** | 認証・JWT発行 | `getToken({ template: "supabase" })` |
| **Supabase** | DB・Storage・RLS | `createBrowserClient(token)` |
| **Stripe** | 課金管理 | Webhook（checkout.session.completed / invoice.paid） |
| **Vercel** | ホスティング | GitHub連携による自動デプロイ |

---

## 🧭 ローカル開発手順

### 1. クローン & インストール
```bash
git clone https://github.com/yourusername/launchify.git
cd launchify
pnpm install
