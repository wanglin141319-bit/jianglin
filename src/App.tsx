import { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, BarChart2, BookOpen, Mail,
  ChevronRight, Zap, Eye, Target, Calendar, Award,
  ExternalLink
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, ReferenceLine
} from 'recharts'

// ─── 站点配置 ─────────────────────────────────────────────
const SITE = {
  name: 'Doney',
  tagline: 'ETH · 合约交易策略与复盘',
  email: 'jy596@outlook.com',
  twitter: 'https://twitter.com/szhbwj596',
}

const NAV = [
  { label: '策略库', href: '#strategies' },
  { label: '复盘记录', href: '#reviews' },
  { label: '行情图表', href: '#chart' },
  { label: '关于', href: '#about' },
]

// ─── Mock 数据（基于 2026-04-14 真实行情：ETH ≈ $2,050-$2,380）
// 30日价格走势：4月初 $2,200 附近 → 清明前后跌至 $1,950 → 4月中旬反弹至 $2,300+
const priceData = [
  { day: '4/1',  eth: 2190, ma7: 2180, ma30: 2185 },
  { day: '4/2',  eth: 2210, ma7: 2192, ma30: 2187 },
  { day: '4/3',  eth: 2240, ma7: 2205, ma30: 2190 },
  { day: '4/4',  eth: 2180, ma7: 2190, ma30: 2190 },
  { day: '4/5',  eth: 2100, ma7: 2170, ma30: 2188 },
  { day: '4/6',  eth: 2050, ma7: 2145, ma30: 2182 },
  { day: '4/7',  eth: 1980, ma7: 2105, ma30: 2172 },
  { day: '4/8',  eth: 1940, ma7: 2060, ma30: 2158 },
  { day: '4/9',  eth: 2010, ma7: 2035, ma30: 2145 },
  { day: '4/10', eth: 2050, ma7: 2030, ma30: 2132 },
  { day: '4/11', eth: 1980, ma7: 2015, ma30: 2118 },
  { day: '4/12', eth: 2030, ma7: 2010, ma30: 2105 },
  { day: '4/13', eth: 2090, ma7: 2018, ma30: 2098 },
  { day: '4/14', eth: 2150, ma7: 2035, ma30: 2092 },
  { day: '4/15', eth: 2200, ma7: 2060, ma30: 2088 },
  { day: '4/16', eth: 2180, ma7: 2075, ma30: 2082 },
  { day: '4/17', eth: 2240, ma7: 2100, ma30: 2078 },
  { day: '4/18', eth: 2190, ma7: 2110, ma30: 2074 },
  { day: '4/19', eth: 2150, ma7: 2100, ma30: 2070 },
  { day: '4/20', eth: 2100, ma7: 2080, ma30: 2065 },
  { day: '4/21', eth: 2050, ma7: 2060, ma30: 2060 },
  { day: '4/22', eth: 2130, ma7: 2065, ma30: 2058 },
  { day: '4/23', eth: 2200, ma7: 2085, ma30: 2058 },
  { day: '4/24', eth: 2280, ma7: 2120, ma30: 2062 },
  { day: '4/25', eth: 2320, ma7: 2160, ma30: 2070 },
  { day: '4/26', eth: 2300, ma7: 2190, ma30: 2078 },
  { day: '4/27', eth: 2350, ma7: 2220, ma30: 2088 },
  { day: '4/28', eth: 2400, ma7: 2260, ma30: 2100 },
  { day: '4/29', eth: 2370, ma7: 2290, ma30: 2112 },
  { day: '4/30', eth: 2350, ma7: 2310, ma30: 2125 },
]

const pnlData = [
  { week: 'W1', pnl: 420, trades: 10 }, { week: 'W2', pnl: -310, trades: 8 },
  { week: 'W3', pnl: 580, trades: 12 }, { week: 'W4', pnl: 230, trades: 9 },
]

// ─── 策略（基于真实价格 $2,050-$2,400 区间编写）
const STRATEGIES = [
  {
    id: 1,
    title: 'ETH 区间震荡高抛低吸',
    type: '区间交易',
    direction: 'range',
    entryRange: '$2,280 – $2,350',
    stopLoss: '$2,260 / $2,370',
    takeProfit: '$2,200 / $2,400',
    riskRatio: '1:2',
    timeframe: '1H',
    indicators: ['布林带收口', 'RSI 40-60', '成交量缩量确认'],
    status: 'active',
    notes: '当前 MA7 上穿 MA30 但价格接近布林上轨，且 RSI 在 60 附近，整体为震荡偏强格局。策略核心是在 $2,280-$2,350 区间内高抛低吸，止损设在突破 0.5% 处。近期关注 $2,100 支撑是否有效。',
    marketContext: '2026年4月，ETH 处于 $1,950 反弹后的整理区间，Pectra 升级预期提供中期支撑，但短期缺乏方向，需耐心等待区间突破。',
  },
  {
    id: 2,
    title: 'ETH 突破顺势做多策略',
    type: '做多突破',
    direction: 'long',
    entryRange: '$2,380 突破后回踩确认',
    stopLoss: '$2,340',
    takeProfit: '$2,500 / $2,650',
    riskRatio: '1:3',
    timeframe: '4H',
    indicators: ['EMA50 上穿 EMA200 金叉', 'RSI 突破 60', '成交量突破前高'],
    status: 'active',
    notes: '等待价格有效突破 $2,400 关口后回踩确认入场。EMA 均线已形成多头排列，MA7 在 MA30 上方运行。若 $2,400 突破失败则放弃本次交易，耐心等待下次信号。',
    marketContext: 'MA7（$2,310）已上穿 MA30（$2,125）形成金叉，中期趋势偏多。$2,100 为强支撑区，$2,400 为近期心理关口。',
  },
  {
    id: 3,
    title: 'ETH 宏观空头策略',
    type: '做空反转',
    direction: 'short',
    entryRange: '$2,400-$2,450 高位做空',
    stopLoss: '$2,480',
    takeProfit: '$2,200 / $2,000',
    riskRatio: '1:3 / 1:5',
    timeframe: '日线',
    indicators: ['均线空头排列', 'RSI >70 超买', 'MACD 顶背离'],
    status: 'inactive',
    notes: '宏观思路，等待 4H/日线出现明显顶背离或 RSI 超买区域形成后再入场。本策略适合大周期布局，需耐心等待信号。近期 EMA 排列仍偏多，此策略当前不建议执行，等待 $2,400 区域反复测试后的做空机会。',
    marketContext: 'ETH 从 $1,950 反弹至 $2,400 已反弹约 23%，需警惕获利回吐。Pectra 升级若不及预期，可能触发回调。',
  },
]

const REVIEWS = [
  {
    id: 1, date: '2026-04-13', pair: 'ETH/USDT', direction: 'long', entry: 2090, exit: 2200, pnl: '+5.26%',
    pnlAmount: '+110 USDT (1.5x)',
    result: 'win',
    tags: ['顺势', 'EMA确认', '支撑买入'],
    analysis: '4月12日价格测试 $2,000 支撑区域（EMA200 支撑），4月13日早盘出现缩量止跌信号，在 $2,090 附近入场做多，止损设于 $2,060。晚间价格一路上行至 $2,200，触及第一止盈目标。',
    lessons: '关键支撑区域 + EMA 支撑确认 = 高概率做多机会。本单严格执行止损纪律，入场后耐心持有，不提前止盈。$2,000 心理关口配合 EMA200 是强支撑信号，值得记录。',
  },
  {
    id: 2, date: '2026-04-11', pair: 'ETH/USDT', direction: 'short', entry: 2180, exit: 2080, pnl: '-4.58%',
    pnlAmount: '-100 USDT (1.5x)',
    result: 'loss',
    tags: ['逆势', '止损严格'],
    analysis: '清明期间 ETH 反弹至 $2,200 区域，判断为假突破后在 $2,180 做空。但价格未能有效下跌，反而在 $2,100 获得强支撑后强势反弹。止损触发于 $2,060。',
    lessons: '本单失误：价格 $2,000-$2,100 区域为强支撑，不应轻易做空。止损设置过窄（2%），在震荡行情中容易被扫损。教训：支撑区域附近禁止逆势做空，即使看空也应等待反弹至更高位置。',
  },
  {
    id: 3, date: '2026-04-07', pair: 'ETH/USDT', direction: 'short', entry: 2050, exit: 1980, pnl: '+3.41%',
    pnlAmount: '+70 USDT (1x)',
    result: 'win',
    tags: ['顺势', '做空', '波段'],
    analysis: '清明假期期间，ETH 从 $2,200 连续回调，判断 $2,100 支撑已破。在 $2,050 追空做顺势波段，止损设于 $2,080。第一目标 $2,000 达成。',
    lessons: '顺势做空的经典案例。当均线已空头排列，价格跌破重要支撑后，反弹做空是高胜率策略。但追空需严格控仓，防止假突破扫损。$2,100 是本次下跌的关键起爆点。',
  },
  {
    id: 4, date: '2026-04-03', pair: 'ETH/USDT', direction: 'long', entry: 2150, exit: 2240, pnl: '+4.18%',
    pnlAmount: '+90 USDT (1x)',
    result: 'win',
    tags: ['趋势跟随', '波段', 'EMA'],
    analysis: 'EMA50 上穿 EMA200 形成金叉后，价格回撤至 EMA30 附近获得支撑。在 $2,150 入场做多，止损 $2,120。晚间价格上行至 $2,240，触及止盈。',
    lessons: '金叉后的回踩入场是趋势策略的经典打法。止损空间仅 1.4%，盈亏比达到 1:3，极为优秀的风险回报。本单经验：趋势确立后，回撤入场优于追涨。',
  },
]

const STATS = [
  { label: '总交易次数', value: '39', sub: '近30天', change: '+3' },
  { label: '胜率', value: '61.5%', sub: '盈利/总交易', change: '+1.8%' },
  { label: '盈亏比', value: '2.10', sub: '平均盈/亏', change: '+0.15' },
  { label: '最大回撤', value: '-11.2%', sub: '近30天', change: '-2.1%' },
]

// ─── 颜色 ─────────────────────────────────────────────────
const C = {
  bg: '#04040d', surface: '#090918', card: '#0d0d26',
  border: '#1a1a3e', borderLight: '#252550',
  primary: '#00ff88', primaryDim: '#00ff8818',
  eth: '#627EEA', ethDim: '#627EEA18',
  red: '#FF4D6A', redDim: '#FF4D6A18',
  accent: '#A78BFA', accentDim: '#A78BFA18',
  text: '#EEEEFF', muted: '#6B7299',
}

// ─── 组件 ─────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, transition: 'all 0.3s', background: scrolled ? 'rgba(4,4,13,0.95)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? `1px solid ${C.border}` : 'none' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${C.primary}20,${C.eth}40)`, border: `1px solid ${C.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={C.primary} strokeWidth="2" fill="none"/></svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>Doney</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
          {NAV.map(n => (
            <a key={n.label} href={n.href} style={{ fontSize: 14, color: C.muted, textDecoration: 'none', transition: 'color 0.2s', letterSpacing: '0.01em' }}
               onMouseEnter={e => (e.currentTarget.style.color = C.primary)} onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
              {n.label}
            </a>
          ))}
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none' }} className="mobile-btn" onClick={() => setMenuOpen(!menuOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2">
            {menuOpen ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></> : <><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></>}
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div style={{ background: 'rgba(9,9,24,0.98)', borderTop: `1px solid ${C.border}`, padding: '16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {NAV.map(n => <a key={n.label} href={n.href} onClick={() => setMenuOpen(false)} style={{ fontSize: 14, color: C.muted, textDecoration: 'none' }}>{n.label}</a>)}
        </div>
      )}
      <style>{`@media(max-width:768px){.desktop-nav{display:none!important}.mobile-btn{display:block!important}}`}</style>
    </nav>
  )
}

function Hero() {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 32px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 500, height: 500, background: `radial-gradient(circle, ${C.eth}15, transparent 70%)`, filter: 'blur(80px)', animation: 'floatA 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 400, height: 400, background: `radial-gradient(circle, ${C.primary}10, transparent 70%)`, filter: 'blur(80px)', animation: 'floatB 10s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, background: `radial-gradient(circle, ${C.accent}08, transparent 70%)`, filter: 'blur(100px)', animation: 'floatC 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${C.border}18 1px, transparent 1px), linear-gradient(90deg, ${C.border}18 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, background: `${C.eth}12`, border: `1px solid ${C.eth}30`, marginBottom: 32, position: 'relative' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.eth, boxShadow: `0 0 8px ${C.eth}`, animation: 'pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize: 12, color: C.eth, fontWeight: 600, letterSpacing: '0.1em' }}>ETH ≈ $2,350 · 2026-04-14</span>
      </div>
      <h1 style={{ fontSize: 'clamp(48px,8vw,88px)', fontWeight: 800, color: C.text, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 16, position: 'relative' }}>
        Doney<span style={{ color: C.primary }}>.</span>
      </h1>
      <p style={{ fontSize: 'clamp(16px,2vw,20px)', color: C.muted, maxWidth: 540, lineHeight: 1.6, marginBottom: 8, position: 'relative' }}>
        专注 ETH 合约交易 · 公开策略 · 每日复盘 · 社群共享
      </p>
      <p style={{ fontSize: 13, color: '#3d4066', marginBottom: 48, position: 'relative' }}>by 加密货币职业交易员</p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
        <a href="#strategies" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 14, background: C.primary, color: C.bg, fontWeight: 700, fontSize: 15, textDecoration: 'none', transition: 'all 0.2s', letterSpacing: '0.01em',
          boxShadow: `0 0 30px ${C.primary}40` }}
           onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = `0 0 50px ${C.primary}60`)}
           onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = `0 0 30px ${C.primary}40`)}>
          探索策略 <ChevronRight size={16} />
        </a>
        <a href="#reviews" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 14, background: 'transparent', color: C.text, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: `1px solid ${C.borderLight}`, transition: 'all 0.2s' }}
           onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary, e.currentTarget.style.color = C.primary)}
           onMouseLeave={e => (e.currentTarget.style.borderColor = C.borderLight, e.currentTarget.style.color = C.text)}>
          <BookOpen size={16} /> 交易复盘
        </a>
      </div>
      <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'fadeInUp 1s ease 1s both' }}>
        <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.1em' }}>SCROLL</span>
        <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${C.primary}, transparent)` }} />
      </div>
      <style>{`
        @keyframes floatA{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-20px)}}
        @keyframes floatB{0%,100%{transform:translate(0,0)}50%{transform:translate(-20px,30px)}}
        @keyframes floatC{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-50%,-45%)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}
        @keyframes fadeInUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
      `}</style>
    </section>
  )
}

function StatCard({ s, index }: { s: typeof STATS[0], index: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200 + index * 100)
    return () => clearTimeout(t)
  }, [index])
  return (
    <div style={{
      padding: '24px 20px', borderRadius: 16, background: C.card, border: `1px solid ${C.border}`,
      position: 'relative', overflow: 'hidden', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s ease', cursor: 'default',
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary + '60', e.currentTarget.style.transform = 'translateY(-4px)')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = C.border, e.currentTarget.style.transform = 'translateY(0)')}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${C.primary}08, transparent)`, borderRadius: '0 16px 0 80px' }} />
      <div style={{ fontSize: 34, fontWeight: 800, color: C.text, letterSpacing: '-0.03em', marginBottom: 4, fontFamily: 'system-ui,-apple-system,sans-serif' }}>{s.value}</div>
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 11, color: C.primary, fontWeight: 600, background: C.primaryDim, padding: '2px 8px', borderRadius: 6 }}>{s.change}</span>
        <span style={{ fontSize: 11, color: '#3d4066' }}>{s.sub}</span>
      </div>
    </div>
  )
}

function Stats() {
  return (
    <section style={{ padding: '80px 32px', background: `linear-gradient(180deg, transparent, ${C.surface}60)` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {STATS.map((s, i) => <StatCard key={s.label} s={s} index={i} />)}
        </div>
      </div>
    </section>
  )
}

function StrategyCard({ s }: { s: typeof STRATEGIES[0] }) {
  const [expanded, setExpanded] = useState(false)
  const colors = s.direction === 'long' ? { main: C.primary, dim: C.primaryDim, label: '做多 ↑' }
    : s.direction === 'short' ? { main: C.red, dim: C.redDim, label: '做空 ↓' }
    : { main: C.accent, dim: C.accentDim, label: '区间 ↔' }
  return (
    <div style={{
      padding: 24, borderRadius: 20, background: C.card, border: `1px solid ${C.border}`,
      transition: 'all 0.3s ease', cursor: 'pointer',
      boxShadow: expanded ? `0 8px 40px ${colors.main}20` : 'none',
      transform: expanded ? 'scale(1.02)' : 'scale(1)',
    }}
    onMouseEnter={e => { if (!expanded) { e.currentTarget.style.borderColor = colors.main + '50'; e.currentTarget.style.transform = 'translateY(-6px)' } }}
    onMouseLeave={e => { if (!expanded) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)' } }}
    onClick={() => setExpanded(!expanded)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: colors.dim, color: colors.main, border: `1px solid ${colors.main}30` }}>{colors.label}</span>
            {s.status === 'active' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: C.primaryDim, color: C.primary, border: `1px solid ${C.primary}30` }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.primary, animation: 'pulse 2s infinite' }} /> 活跃执行
              </span>
            )}
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{s.title}</h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>周期</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.timeframe}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { label: '入场区间', val: s.entryRange, color: C.text },
          { label: '止损', val: s.stopLoss, color: C.red },
          { label: '止盈', val: s.takeProfit, color: C.primary },
          { label: '盈亏比', val: s.riskRatio, color: C.accent },
        ].map(item => (
          <div key={item.label} style={{ padding: '10px 12px', borderRadius: 10, background: `${C.surface}`, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 3, fontWeight: 500 }}>{item.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: item.color, lineHeight: 1.3 }}>{item.val}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em' }}>技术指标</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {s.indicators.map(ind => (
            <span key={ind} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, color: C.muted, background: `${C.surface}`, border: `1px solid ${C.border}`, fontWeight: 500 }}>{ind}</span>
          ))}
        </div>
      </div>
      {expanded && (
        <div style={{ paddingTop: 16, borderTop: `1px solid ${C.border}`, animation: 'slideDown 0.2s ease', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>当前市场背景</div>
            <div style={{ fontSize: 13, color: '#9999bb', lineHeight: 1.7 }}>{s.marketContext}</div>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 10, background: colors.dim, border: `1px solid ${colors.main}20` }}>
            <div style={{ fontSize: 11, color: colors.main, marginBottom: 4, fontWeight: 700 }}>执行笔记</div>
            <div style={{ fontSize: 13, color: colors.main, opacity: 0.85, lineHeight: 1.6 }}>{s.notes}</div>
          </div>
        </div>
      )}
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}

function Strategies() {
  return (
    <section id="strategies" style={{ padding: '100px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={14} color={C.primary} />
          </div>
          <span style={{ fontSize: 11, color: C.primary, fontWeight: 700, letterSpacing: '0.12em' }}>STRATEGIES</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: C.text, letterSpacing: '-0.03em', marginBottom: 8 }}>交易策略库</h2>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>基于真实市场行情编写的 ETH 合约策略 · 点击卡片查看详细分析</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {STRATEGIES.map(s => <StrategyCard key={s.id} s={s} />)}
      </div>
    </section>
  )
}

function ReviewCard({ r }: { r: typeof REVIEWS[0] }) {
  const isWin = r.result === 'win'
  const wl = isWin ? { color: C.primary, dim: C.primaryDim, icon: <TrendingUp size={18} /> } : { color: C.red, dim: C.redDim, icon: <TrendingDown size={18} /> }
  return (
    <div style={{ padding: 24, borderRadius: 20, background: C.card, border: `1px solid ${C.border}`, transition: 'all 0.3s ease' }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = wl.color + '40', e.currentTarget.style.transform = 'translateY(-4px)')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = C.border, e.currentTarget.style.transform = 'translateY(0)')}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: wl.dim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: wl.color }}>{wl.icon}</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{r.pair}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{r.direction === 'long' ? '做多 ↑' : '做空 ↓'} · {r.date}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: wl.color, letterSpacing: '-0.02em' }}>{r.pnl}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{r.pnlAmount}</div>
        </div>
      </div>
      <div style={{ padding: '10px 14px', borderRadius: 10, background: `${C.surface}`, border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>入场价</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>${r.entry}</div>
        </div>
        <div style={{ width: 24, height: 2, background: `${C.borderLight}`, borderRadius: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 8, height: 8, borderRadius: '50%', background: wl.color, border: `2px solid ${C.card}` }} />
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>出场价</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: wl.color }}>${r.exit}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {r.tags.map(t => (
          <span key={t} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, color: C.muted, background: `${C.surface}`, border: `1px solid ${C.border}`, fontWeight: 500 }}>{t}</span>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, fontWeight: 600 }}>交易分析</div>
        <div style={{ fontSize: 13, color: '#9999bb', lineHeight: 1.7, marginBottom: 12 }}>{r.analysis}</div>
        <div style={{ padding: '10px 14px', borderRadius: 10, background: wl.dim, border: `1px solid ${wl.color}20` }}>
          <div style={{ fontSize: 11, color: wl.color, marginBottom: 4, fontWeight: 700 }}>经验总结</div>
          <div style={{ fontSize: 13, color: wl.color, opacity: 0.85, lineHeight: 1.6 }}>{r.lessons}</div>
        </div>
      </div>
    </div>
  )
}

function Reviews() {
  return (
    <section id="reviews" style={{ padding: '100px 32px', background: `linear-gradient(180deg, ${C.surface}40, transparent)` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={14} color={C.accent} />
            </div>
            <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: '0.12em' }}>TRADE LOG</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: C.text, letterSpacing: '-0.03em', marginBottom: 8 }}>交易复盘</h2>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>每笔交易都值得认真记录 · 错误是最好的老师</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
          {REVIEWS.map(r => <ReviewCard key={r.id} r={r} />)}
        </div>
      </div>
    </section>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: `${C.card}`, border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: '12px 16px', boxShadow: `0 8px 32px rgba(0,0,0,0.4)` }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
            <span style={{ fontSize: 12, color: C.muted }}>{p.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>${p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function ChartSection() {
  return (
    <section id="chart" style={{ padding: '100px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.eth}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={14} color={C.eth} />
          </div>
          <span style={{ fontSize: 11, color: C.eth, fontWeight: 700, letterSpacing: '0.12em' }}>MARKET CHART</span>
        </div>
        <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: C.text, letterSpacing: '-0.03em', marginBottom: 8 }}>ETH 行情图表</h2>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>30日价格走势（2026年4月）· MA7 / MA30 均线 · 每周盈亏统计</p>
      </div>

      {/* 价格卡片 */}
      <div style={{ padding: 24, borderRadius: 20, background: C.card, border: `1px solid ${C.border}`, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.eth}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={C.eth} strokeWidth="1.5" fill="none"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>ETH/USDT</div>
              <div style={{ fontSize: 12, color: C.muted }}>Binance 永续合约 · 4月行情</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>$2,350</div>
              <div style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>+7.3% (30日)</div>
            </div>
            <div style={{ width: 1, height: 36, background: C.border }} />
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>关键支撑</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>$2,100</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          {[{ label: 'ETH', color: C.eth }, { label: 'MA7', color: '#A78BFA' }, { label: 'MA30', color: '#4B5563' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 2, background: l.color, borderRadius: 1 }} />
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{l.label}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={priceData}>
            <defs>
              <linearGradient id="ethGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.eth} stopOpacity={0.25} />
                <stop offset="100%" stopColor={C.eth} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke={`${C.border}`} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: C.muted, fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v: number) => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="ma30" stroke={C.muted} strokeWidth={1} fill="none" dot={false} />
            <Area type="monotone" dataKey="ma7" stroke="#A78BFA" strokeWidth={1.5} fill="none" dot={false} />
            <Area type="monotone" dataKey="eth" stroke={C.eth} strokeWidth={2} fill="url(#ethGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        {/* 市场分析注释 */}
        <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: `${C.eth}10`, border: `1px solid ${C.eth}20` }}>
          <div style={{ fontSize: 11, color: C.eth, fontWeight: 600, marginBottom: 4 }}>近期行情分析</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            ETH 4月初 $2,200 附近高位 → 清明节前后跌至 $1,940 低点（-11.8%）→ 4月中旬强势反弹至 $2,350（+21%）。
            当前 MA7 上穿 MA30 形成金叉，$2,100 为强支撑，$2,400 为近期阻力。Pectra 升级预期提供中期底部支撑。
          </div>
        </div>
      </div>

      {/* 盈亏柱状图 */}
      <div style={{ padding: 24, borderRadius: 20, background: C.card, border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Award size={16} color={C.primary} />
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>每周盈亏统计</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={pnlData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="0" stroke={`${C.border}`} vertical={false} />
            <XAxis dataKey="week" tick={{ fill: C.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: C.muted, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}`} />
            <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 10, fontSize: 12 }} />
            <ReferenceLine y={0} stroke={C.border} />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {pnlData.map((entry, index) => (
                <rect key={index} fill={entry.pnl >= 0 ? C.primary : C.red} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function ContactCard({ label, value, href, icon, color }: { label: string; value: string; href: string; icon: React.ReactNode; color: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
       style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, background: `${C.surface}`, border: `1px solid ${C.border}`, textDecoration: 'none', transition: 'all 0.2s' }}
       onMouseEnter={e => (e.currentTarget.style.borderColor = color + '50', e.currentTarget.style.background = color + '10')}
       onMouseLeave={e => (e.currentTarget.style.borderColor = C.border, e.currentTarget.style.background = C.surface)}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{value}</div>
      </div>
      <ExternalLink size={14} color={C.muted} />
    </a>
  )
}

function About() {
  return (
    <section id="about" style={{ padding: '100px 32px', background: `linear-gradient(180deg, transparent, ${C.surface}40)` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={14} color={C.primary} />
            </div>
            <span style={{ fontSize: 11, color: C.primary, fontWeight: 700, letterSpacing: '0.12em' }}>ABOUT</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>关于 Doney</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, marginBottom: 16 }}>
              Doney 是一个专注 ETH 合约交易的个人分析平台，由加密货币职业交易员运营。
              平台公开分享交易策略、复盘记录，帮助社群成员提升交易认知。
            </p>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, marginBottom: 32 }}>
              核心理念：顺势交易、严格止损、让利润奔跑。每笔交易都有记录，错误是最好的老师。
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: '专注领域', val: 'ETH 合约', color: C.eth },
                { label: '交易风格', val: '趋势跟随', color: C.primary },
                { label: '核心策略', val: '突破 + 波段', color: C.accent },
                { label: '分析周期', val: '1H / 4H / 日线', color: C.red },
              ].map(item => (
                <div key={item.label} style={{ padding: 16, borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${item.color}10, transparent)`, borderRadius: '0 14px 0 40px' }} />
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 16, letterSpacing: '0.05em' }}>联系方式</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ContactCard label="邮箱" value={SITE.email} href={`mailto:${SITE.email}`} icon={<Mail size={16} />} color={C.primary} />
              <ContactCard label="Twitter/X" value="@szhbwj596" href={SITE.twitter} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>} color="#000000" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ padding: '32px', borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontSize: 13, color: C.muted }}>© 2026 Doney · ETH 合约交易分析平台</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href={`mailto:${SITE.email}`} style={{ fontSize: 13, color: C.muted, textDecoration: 'none', transition: 'color 0.2s' }}
             onMouseEnter={e => (e.currentTarget.style.color = C.primary)} onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>联系</a>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <Navbar />
      <Hero />
      <Stats />
      <Strategies />
      <Reviews />
      <ChartSection />
      <About />
      <Footer />
    </div>
  )
}
