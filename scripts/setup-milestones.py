#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

# GitHub API設定
# 使用方法: GITHUB_TOKEN=your_token python3 setup-milestones.py
import os
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO_OWNER = "nomu-nora"
REPO_NAME = "cut-optimizer"
API_URL = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}"

def api_request(method, endpoint, data=None):
    """GitHub APIリクエストを送信"""
    url = f"{API_URL}{endpoint}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }

    req_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Error: {e.code} {e.reason}")
        return None

def create_milestone(title, description):
    """マイルストーンを作成"""
    data = {
        "title": title,
        "description": description,
        "state": "open"
    }
    result = api_request("POST", "/milestones", data)
    if result:
        print(f"✓ Created milestone: {title} (#{result['number']})")
        return result['number']
    else:
        print(f"✗ Failed to create milestone: {title}")
        return None

def get_all_issues():
    """すべてのIssueを取得"""
    issues = []
    page = 1
    while True:
        result = api_request("GET", f"/issues?state=open&page={page}&per_page=100")
        if not result or len(result) == 0:
            break
        issues.extend(result)
        page += 1
    return issues

def update_issue_milestone(issue_number, milestone_number):
    """IssueにMilestoneを割り当て"""
    data = {"milestone": milestone_number}
    result = api_request("PATCH", f"/issues/{issue_number}", data)
    if result:
        print(f"  ✓ Issue #{issue_number} → Milestone #{milestone_number}")
        return True
    else:
        print(f"  ✗ Failed to update Issue #{issue_number}")
        return False

# マイルストーン定義
milestones = [
    {
        "title": "Phase 1: プロジェクト設計・技術設計",
        "description": "システムアーキテクチャ、データフロー、UI/UXの設計",
        "phase_label": "phase-1"
    },
    {
        "title": "Phase 2: 開発環境セットアップ",
        "description": "Next.jsプロジェクトの初期化と開発ツールの設定",
        "phase_label": "phase-2"
    },
    {
        "title": "Phase 3: 型定義・データ構造の実装",
        "description": "TypeScriptの型定義とデータ構造の実装",
        "phase_label": "phase-3"
    },
    {
        "title": "Phase 4: アルゴリズム実装",
        "description": "Guillotine Cut + First Fit Decreasingアルゴリズムの実装",
        "phase_label": "phase-4"
    },
    {
        "title": "Phase 5: UI基本構造の実装",
        "description": "アプリケーションの基本レイアウトとコンポーネントの実装",
        "phase_label": "phase-5"
    },
    {
        "title": "Phase 6: 入力フォーム・設定画面の実装",
        "description": "ユーザー入力フォームとバリデーションの実装",
        "phase_label": "phase-6"
    },
    {
        "title": "Phase 7: 結果表示・配置図の実装",
        "description": "計算結果の表示と配置図の描画機能の実装",
        "phase_label": "phase-7"
    },
    {
        "title": "Phase 8: 印刷機能の実装",
        "description": "印刷用CSS、プレビュー、PDF出力の実装",
        "phase_label": "phase-8"
    },
    {
        "title": "Phase 9: テスト・デバッグ",
        "description": "単体テスト、統合テスト、実データ検証、バグ修正",
        "phase_label": "phase-9"
    },
    {
        "title": "Phase 10: デプロイ・リリース",
        "description": "Vercelデプロイ、ドキュメント整備、v1.0リリース",
        "phase_label": "phase-10"
    }
]

print("=== マイルストーンを作成中 ===\n")

# マイルストーンを作成
milestone_map = {}  # phase_label -> milestone_number
for milestone_info in milestones:
    milestone_number = create_milestone(
        milestone_info["title"],
        milestone_info["description"]
    )
    if milestone_number:
        milestone_map[milestone_info["phase_label"]] = milestone_number

print(f"\n=== Issuesを取得中 ===\n")

# すべてのIssueを取得
issues = get_all_issues()
print(f"取得したIssue数: {len(issues)}\n")

print("=== IssuesにMilestoneを割り当て中 ===\n")

# 各IssueにMilestoneを割り当て
for issue in issues:
    # Issueのラベルから対応するphaseを見つける
    phase_label = None
    for label in issue['labels']:
        if label['name'].startswith('phase-'):
            phase_label = label['name']
            break

    if phase_label and phase_label in milestone_map:
        milestone_number = milestone_map[phase_label]
        update_issue_milestone(issue['number'], milestone_number)
    else:
        print(f"  ⚠ Issue #{issue['number']}: phaseラベルが見つかりません")

print(f"\n=== 完了 ===")
print(f"マイルストーンの設定が完了しました！")
print(f"https://github.com/{REPO_OWNER}/{REPO_NAME}/milestones で確認できます")
