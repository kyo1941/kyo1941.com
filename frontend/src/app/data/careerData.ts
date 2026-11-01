export type Task = {
  content: string;
  details?: string[];
};

export type Career = {
  company: string;
  url: string;
  period: string;
  position: string;
  tasks: Task[];
  technologies: string[];
};

export const CURRENT_TERM = "現在";

export const careerData: Career[] = [
  {
    company: "株式会社サイバーエージェント",
    url: "https://www.cyberagent.co.jp/",
    period: `2026年4月 - 2026年4月`,
    position: "ABEMA - Androidエンジニア（インターン）",
    tasks: [
      {
        content: "動画配信サービス「ABEMA」のAndroidエンジニアとして1ヶ月従事",
      },
      {
        content:
          "既存の実装を改修し、KMP対応にリアーキテクチャするタスクを担当",
        details: [
          "クリーンアーキテクチャに基づいた堅牢なアーキテクチャのキャッチアップと設計",
          "PlantUMLを使用して設計書を作成し、Claude Codeを用いた半自動化した開発スタイルの検証",
        ],
      },
      {
        content: "インターンシップ参加にあたり記事も執筆しました",
        details: ["https://developers.cyberagent.co.jp/blog/archives/63964/"],
      },
    ],
    technologies: ["Kotlin", "Kotlin Multiplatform", "PlantUML"],
  },
  {
    company: "株式会社MIXI",
    url: "https://mixi.co.jp/",
    period: "2026年2月 - 2026年2月",
    position: "みてね - Androidエンジニア（インターン）",
    tasks: [
      {
        content:
          "子供の写真共有アプリ「みてね」のAndroidエンジニアとして1ヶ月従事",
      },
      {
        content:
          "古いライブラリの改修に伴い、ADR の作成と PoC の実装による技術調査と技術選定を担当",
      },
      {
        content: "Splash Screen におけるロゴの差し替えを担当",
        details: [
          "ガイドラインや API 仕様でのデザイン調整や、試作を通した CFT での調整を行い実装",
        ],
      },
      { content: "その他、レガシーな技術のリプレイスも担当" },
    ],
    technologies: ["Kotlin", "RxJava", "Kotlin Coroutines", "Dagger", "Hilt"],
  },
  {
    company: "株式会社ドワンゴ",
    url: "https://dwango.co.jp/",
    period: "2025年11月 - 2026年1月",
    position: "ニコニコ動画 - Androidエンジニア（インターン）",
    tasks: [
      {
        content: "動画アプリ「ニコニコ動画」のAndroidエンジニアとして3ヶ月従事",
      },
      {
        content: "ショート動画実装の大規模案件のメンバーとしてアサイン",
        details: [
          "一画面でのUI実装から、API やデータ接続まで通して実装",
          "数値分析の仕様調整やデザインの調整など、企画やデザイナーとのコミュニケーションも行いながら実装",
          "プッシュ通知やディープリンクの外部動線の実装",
        ],
      },
      {
        content:
          "不具合修正の保守・運用や、Java → Kotlin へのリプレイスなども担当",
      },
    ],
    technologies: ["Kotlin", "Jetpack Compose", "MVVM"],
  },
  {
    company: "株式会社ミラティブ",
    url: "https://mirrativ.co.jp/",
    period: "2025年10月 - 2025年10月",
    position: "ミラティブ - Androidエンジニア（インターン）",
    tasks: [
      {
        content:
          "ライブ配信アプリ「ミラティブ」のAndroidエンジニアとして1ヶ月従事",
      },
      {
        content: "既存のXMLベースのUIをJetpack Composeに置き換える作業を担当",
        details: [
          "Fluxアーキテクチャの設計や実装のキャッチアップをしながら実装",
        ],
      },
    ],
    technologies: ["Kotlin", "Jetpack Compose", "Flux", "Koin"],
  },
  {
    company: "Sansan株式会社",
    url: "https://jp.corp-sansan.com/",
    period: "2025年8月 - 2025年9月",
    position: "Eight- Androidエンジニア（インターン）",
    tasks: [
      {
        content: "toC名刺管理アプリ「Eight」のAndroidエンジニアとして1ヶ月従事",
      },
      {
        content: "名刺反転アニメーションを実装する新機能開発を担当",
        details: [
          "モーションセンサーを用いた端末角度の算出処理と、端末負荷を考慮したライフサイクル管理を実装",
          "角度の閾値の調整やアニメーションの調整など、PdM とのコミュニケーションも行いながら実装",
        ],
      },
      {
        content: "名刺手動登録時でのダイアログによる動線の実装",
        details: [
          "国際化対応におけるデザイン崩れでの調整や、共通コンポーネントの提案・実装なども担当",
        ],
      },
    ],
    technologies: [
      "Kotlin",
      "Jetpack Compose",
      "MVVM",
      "Hilt",
      "Kotlin Coroutines",
    ],
  },
  {
    company: "埼玉大学",
    url: "https://www.saitama-u.ac.jp/",
    period: "2021年4月 - 2027年3月",
    position: "工学部 情報工学科 / 理工学研究科 数理電子情報専攻",
    tasks: [
      { content: "授業での半年間のiOSアプリチーム開発" },
      {
        content:
          "[修士研究] 音声強調における教師なし学習環境下での少量データ学習に関する研究",
        details: [
          "GANをベースとした学習機構や分別器のモデル構成を提案",
          "2025年春季音響学会 ポスター発表",
          "2025年電子通信情報学会 口頭発表",
          "ICICIC2025 口頭発表",
          "2026 ESS Symposium 口頭発表",
        ],
      },
      {
        content:
          "[RA] 深層学習の物体検知モデル（YOLO）を用いた衣服の汚れ検知に関する共同研究",
        details: [
          "精度向上のためのデータ拡張/補正アルゴリズムの設計・実装",
          "データ拡張におけるセグメンテーション処理や、モデルの学習や評価のためのパイプラインの構築などを担当",
          "毎月の成果報告のために進捗の共有や課題の洗い出しなどを行い、プレゼン資料の作成まで担当（プレゼン自体はしていません）",
        ],
      },
    ],
    technologies: [],
  },
];
