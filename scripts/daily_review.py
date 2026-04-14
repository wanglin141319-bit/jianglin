#!/usr/bin/env python3
"""
Doney 每日 ETH 复盘脚本
自动抓取 Binance 行情数据，生成胜率/盈亏比，更新网站数据并推送到 GitHub
"""

import json
import os
import sys
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path
import requests

# ========== 配置 ==========
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
REPO_DIR = Path(__file__).parent.parent
DATA_DIR = REPO_DIR / "public"
HISTORY_FILE = DATA_DIR / "daily_review_log.json"
DATA_FILE = DATA_DIR / "data.json"
APP_FILE = REPO_DIR / "src" / "App.tsx"

BINANCE_API = "https://api.binance.com/api/v3"
HEADERS = {"User-Agent": "Mozilla/5.0"}


def fetch_eth_klines(symbol="ETHUSDT", interval="1h", limit=72):
    """获取最近 N 根 K 线"""
    url = f"{BINANCE_API}/klines"
    params = {"symbol": symbol, "interval": interval, "limit": limit}
    r = requests.get(url, params=params, headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()


def fetch_eth_ticker(symbol="ETHUSDT"):
    """获取当前 ETH 价格"""
    url = f"{BINANCE_API}/ticker/24hr"
    params = {"symbol": symbol}
    r = requests.get(url, params=params, headers=HEADERS, timeout=10)
    r. raise_for_status()
    return r.json()


def calc_ma(klines, period):
    """计算简单移动平均"""
    closes = [float(k[4]) for k in klines]
    if len(closes) < period:
        return None
    return sum(closes[-period:]) / period


def calc_yesterday_stats(klines):
    """从最近 72 根 1h K 线中提取昨天（UTC）的统计数据"""
    # klines 按时间升序，最后一根是当前小时
    # 昨天 UTC 00:00 ~ 23:59 = 24 根 K 线
    closes = [float(k[4]) for k in klines]
    highs = [float(k[2]) for k in klines]
    lows = [float(k[3]) for k in klines]

    yesterday_closes = closes[-24:]
    yesterday_highs = highs[-24:]
    yesterday_lows = lows[-24:]

    open_price = yesterday_closes[0]
    close_price = yesterday_closes[-1]
    high_price = max(yesterday_highs)
    low_price = min(yesterday_lows)
    change = ((close_price - open_price) / open_price) * 100

    # 波动率
    volatility = ((high_price - low_price) / open_price) * 100

    return {
        "open": round(open_price, 2),
        "close": round(close_price, 2),
        "high": round(high_price, 2),
        "low": round(low_price, 2),
        "change_pct": round(change, 2),
        "volatility_pct": round(volatility, 2),
    }


def analyze_yesterday(klines, stats):
    """根据昨日行情生成策略分析"""
    closes = [float(k[4]) for k in klines]
    ma7 = calc_ma(klines, 7)
    ma30 = calc_ma(klines, 30)
    current_price = closes[-1]

    # MA 状态
    ma7_above_30 = ma7 and ma30 and ma7 > ma30
    ma7_cross_up = len(closes) >= 8 and closes[-8] < closes[-1] and closes[-7] > closes[-2]

    # 趋势判断
    if stats["change_pct"] > 3:
        trend = "强势上涨"
    elif stats["change_pct"] > 0.5:
        trend = "小幅上涨"
    elif stats["change_pct"] < -3:
        trend = "强势下跌"
    elif stats["change_pct"] < -0.5:
        trend = "小幅回调"
    else:
        trend = "区间震荡"

    # 策略建议
    if stats["change_pct"] > 2:
        recommendation = "突破顺势做多，关注 MA7 支撑"
    elif stats["change_pct"] < -2:
        recommendation = "注意支撑位，破位考虑顺势做空"
    else:
        recommendation = "区间震荡，高抛低吸为主"

    # 分析注释
    notes = []
    if ma7_above_30:
        notes.append("MA7 在 MA30 上方，中期多头格局")
    elif ma7 and ma30 and ma7 < ma30:
        notes.append("MA7 在 MA30 下方，中期偏空")
    if stats["volatility_pct"] > 5:
        notes.append(f"日内波动较大（{stats['volatility_pct']:.1f}%），注意止损")
    if abs(stats["change_pct"]) > 3:
        notes.append(f"单边行情（{stats['change_pct']:.1f}%），顺势跟进")

    return {
        "trend": trend,
        "recommendation": recommendation,
        "notes": notes,
        "ma7": round(ma7, 2) if ma7 else None,
        "ma30": round(ma30, 2) if ma30 else None,
        "ma_status": "多头" if ma7_above_30 else ("空头" if (ma7 and ma30 and ma7 < ma30) else "中性"),
    }


def load_history():
    """加载历史复盘记录"""
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def calc_stats(history):
    """从历史记录计算胜率和盈亏比"""
    if not history:
        return {"total_trades": 0, "win_rate": 0, "avg_win_pct": 0, "avg_loss_pct": 0, "profit_factor": 0}

    wins = [r for r in history if r.get("result_pct", 0) > 0]
    losses = [r for r in history if r.get("result_pct", 0) < 0]

    total = len(history)
    win_count = len(wins)
    loss_count = len(losses)

    win_rate = round((win_count / total) * 100, 1) if total > 0 else 0

    avg_win = sum(r["result_pct"] for r in wins) / len(wins) if wins else 0
    avg_loss = abs(sum(r["result_pct"] for r in losses) / len(losses)) if losses else 0

    # 盈亏比 = 平均盈利幅度 / 平均亏损幅度
    profit_factor = round(avg_win / avg_loss, 2) if avg_loss > 0 else 0

    # 总盈亏
    total_pnl = round(sum(r.get("result_pct", 0) for r in history), 2)

    # 最大连胜/连亏
    streaks = []
    current = 0
    direction = 0
    for r in history:
        if r.get("result_pct", 0) > 0:
            if direction == 1:
                current += 1
            else:
                direction = 1
                current = 1
        elif r.get("result_pct", 0) < 0:
            if direction == -1:
                current += 1
            else:
                direction = -1
                current = 1
        streaks.append(current)
    max_streak = max(streaks) if streaks else 0

    return {
        "total_trades": total,
        "win_trades": win_count,
        "loss_trades": loss_count,
        "win_rate": win_rate,
        "avg_win_pct": round(avg_win, 2),
        "avg_loss_pct": round(avg_loss, 2),
        "profit_factor": profit_factor,
        "total_pnl": total_pnl,
        "max_streak": max_streak,
    }


def generate_new_review(yesterday_stats, analysis, current_price_data):
    """生成今日复盘条目"""
    now = datetime.now(timezone(timedelta(hours=8)))  # 北京时间
    today_str = now.strftime("%Y-%m-%d")
    date_label = now.strftime("%m月%d日")

    return {
        "id": f"review_{today_str.replace('-', '')}",
        "date": today_str,
        "date_label": date_label,
        "direction": "做多" if yesterday_stats["change_pct"] > 0 else "做空",
        "entry_price": yesterday_stats["open"],
        "exit_price": yesterday_stats["close"],
        "result_pct": round(yesterday_stats["change_pct"], 2),
        "high": yesterday_stats["high"],
        "low": yesterday_stats["low"],
        "volatility": yesterday_stats["volatility_pct"],
        "analysis": analysis,
        "current_price": current_price_data.get("lastPrice", 0),
        "generated_at": now.isoformat(),
    }


def write_data_json(history, stats, yesterday_stats, analysis, current_price_data):
    """生成 data.json 供网站使用"""
    now = datetime.now(timezone(timedelta(hours=8)))
    today_str = now.strftime("%Y-%m-%d")

    data = {
        "last_updated": today_str,
        "market_summary": {
            "current_price": float(current_price_data.get("lastPrice", 0)),
            "change_24h": round(float(current_price_data.get("priceChangePercent", 0)), 2),
            "high_24h": float(current_price_data.get("highPrice", 0)),
            "low_24h": float(current_price_data.get("lowPrice", 0)),
            "volume": current_price_data.get("volume", ""),
        },
        "yesterday_review": {
            "date": yesterday_stats.get("date", today_str),
            "open": yesterday_stats["open"],
            "close": yesterday_stats["close"],
            "high": yesterday_stats["high"],
            "low": yesterday_stats["low"],
            "change_pct": yesterday_stats["change_pct"],
            "volatility_pct": yesterday_stats["volatility_pct"],
            "trend": analysis["trend"],
            "recommendation": analysis["recommendation"],
            "notes": analysis["notes"],
            "ma7": analysis["ma7"],
            "ma30": analysis["ma30"],
            "ma_status": analysis["ma_status"],
        },
        "performance_stats": stats,
        "recent_reviews": history[-10:],  # 最近 10 条
    }

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[OK] 已写入 {DATA_FILE}")


def git_commit_push(message="Auto-update daily review"):
    """提交并推送到 GitHub"""
    if not GITHUB_TOKEN:
        print("[WARN] GITHUB_TOKEN 未设置，跳过推送。请手动配置环境变量 GITHUB_TOKEN")
        return False

    try:
        # 设置 git 用户信息
        subprocess.run(["git", "config", "user.email", "bot@doney.trade"], cwd=REPO_DIR, check=True, capture_output=True)
        subprocess.run(["git", "config", "user.name", "Doney Bot"], cwd=REPO_DIR, check=True, capture_output=True)

        # 添加 token 到 remote URL
        remote_url = f"https://x-access-token:{GITHUB_TOKEN}@github.com/wanglin141319-bit/jianglin.git"

        subprocess.run(["git", "remote", "set-url", "origin", remote_url], cwd=REPO_DIR, check=True, capture_output=True)
        subprocess.run(["git", "add", str(DATA_FILE), str(HISTORY_FILE)], cwd=REPO_DIR, check=True, capture_output=True)

        result = subprocess.run(["git", "status", "--porcelain"], cwd=REPO_DIR, capture_output=True, text=True)
        if not result.stdout.strip():
            print("[INFO] 没有文件变更，跳过提交")
            return True

        subprocess.run(["git", "commit", "-m", message], cwd=REPO_DIR, check=True, capture_output=True, text=True)
        subprocess.run(["git", "push", "origin", "master"], cwd=REPO_DIR, check=True, capture_output=True, text=True)
        print("[OK] 已推送到 GitHub")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Git 操作失败: {e.stderr}")
        return False


def main():
    print("=" * 50)
    print(f"Doney 每日复盘脚本 - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 50)

    # 1. 获取数据
    print("\n[1/5] 抓取 ETH K 线数据...")
    try:
        klines = fetch_eth_klines(limit=72)
        ticker = fetch_eth_ticker()
        print(f"    当前 ETH 价格: ${float(ticker['lastPrice']):,.2f}")
    except Exception as e:
        print(f"[ERROR] 数据获取失败: {e}")
        sys.exit(1)

    # 2. 分析昨日行情
    print("\n[2/5] 分析昨日行情...")
    stats = calc_yesterday_stats(klines)
    analysis = analyze_yesterday(klines, stats)
    print(f"    开盘: ${stats['open']} → 收盘: ${stats['close']}  涨跌: {stats['change_pct']:+.2f}%")
    print(f"    趋势: {analysis['trend']}")
    print(f"    MA7: ${analysis['ma7']}  MA30: ${analysis['ma30']}  ({analysis['ma_status']})")
    print(f"    建议: {analysis['recommendation']}")

    # 3. 生成复盘记录
    print("\n[3/5] 生成复盘记录...")
    history = load_history()
    new_review = generate_new_review(stats, analysis, ticker)
    history.append(new_review)

    # 只保留最近 90 天记录
    history = history[-90:]
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)
    print(f"    历史记录共 {len(history)} 条")

    # 4. 计算统计数据
    print("\n[4/5] 计算胜率/盈亏比...")
    perf_stats = calc_stats(history)
    print(f"    总交易: {perf_stats['total_trades']}  胜率: {perf_stats['win_rate']}%")
    print(f"    平均盈利: {perf_stats['avg_win_pct']}%  平均亏损: {perf_stats['avg_loss_pct']}%")
    print(f"    盈亏比: {perf_stats['profit_factor']}  总盈亏: {perf_stats['total_pnl']}%")
    print(f"    最大连盈: {perf_stats['max_streak']}  最大连亏: {perf_stats['max_streak']}")

    # 5. 生成 data.json 并推送
    print("\n[5/5] 生成网站数据文件...")
    write_data_json(history, perf_stats, stats, analysis, ticker)

    print("\n[完成] 推送 GitHub...")
    git_commit_push(f"Auto-update: {datetime.now().strftime('%Y-%m-%d')} ETH 复盘")

    print("\n" + "=" * 50)
    print("复盘完成！")
    print("=" * 50)


if __name__ == "__main__":
    main()
