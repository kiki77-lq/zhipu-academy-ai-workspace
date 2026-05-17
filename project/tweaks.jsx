/* Expressive tweaks for 智谱书院 AI Portal */
const { useEffect } = React;

const THEMES = {
  dark: {
    bg: "#0D0F14",
    sidebar: "#10131A",
    card: "#161A23",
    panel: "#181C25",
    border: "#2A3040",
    text: "#F1F5F9",
    text2: "#94A3B8",
    text3: "#64748B",
    primary: "#8B8CF6",
    primaryRgb: "139,140,246",
    teal: "#14B8A6",
    tealRgb: "20,184,166",
    glow: "rgba(139,140,246,0.18)",
    sendInk: "#0D0F14",
    surface: "255,255,255",     // for glass tint
    ambient: `
      radial-gradient(ellipse 60% 45% at 20% 18%, rgba(139,140,246,0.10), transparent 65%),
      radial-gradient(ellipse 55% 45% at 82% 12%, rgba(20,184,166,0.08), transparent 60%),
      radial-gradient(ellipse 70% 55% at 75% 92%, rgba(139,140,246,0.07), transparent 65%),
      linear-gradient(180deg, #0D0F14 0%, #090B10 100%)`,
    isDark: true
  },
  light: {
    bg: "#F7F8FB",
    sidebar: "#FFFFFF",
    card: "#FFFFFF",
    panel: "#F9FAFC",
    border: "#E5E7EB",
    text: "#111827",
    text2: "#64748B",
    text3: "#94A3B8",
    primary: "#4F46E5",
    primaryRgb: "79,70,229",
    teal: "#0F766E",
    tealRgb: "15,118,110",
    glow: "rgba(79,70,229,0.12)",
    sendInk: "#FFFFFF",
    surface: "15,23,42",
    ambient: `
      radial-gradient(ellipse 60% 45% at 20% 18%, rgba(79,70,229,0.06), transparent 65%),
      radial-gradient(ellipse 55% 45% at 82% 12%, rgba(15,118,110,0.05), transparent 60%),
      radial-gradient(ellipse 70% 55% at 75% 92%, rgba(79,70,229,0.04), transparent 65%),
      linear-gradient(180deg, #F7F8FB 0%, #EEF1F6 100%)`,
    isDark: false
  }
};

const DENSITY = {
  compact: { heroPad: "32px 36px 22px", heroFont: "42px", heroMb: "20px", quickGap: "10px", quickPad: "14px 14px 12px", cmdMb: "22px", quickMb: "22px" },
  regular: { heroPad: "56px 40px 28px", heroFont: "48px", heroMb: "28px", quickGap: "14px", quickPad: "18px 18px 16px", cmdMb: "32px", quickMb: "32px" },
  airy:    { heroPad: "84px 48px 32px", heroFont: "56px", heroMb: "36px", quickGap: "18px", quickPad: "22px 22px 20px", cmdMb: "44px", quickMb: "44px" }
};

function applyTweaks(t) {
  const T = THEMES[t.theme] || THEMES.dark;
  const D = DENSITY[t.density] || DENSITY.regular;
  const g = Math.max(0, Math.min(100, +t.glass || 0));
  const k = g / 100;
  const blur = (4 + k * 22).toFixed(1);
  const sat = (110 + k * 30).toFixed(0);
  // surface tint: on dark = white overlay; on light = ink overlay
  const sA = (0.015 + k * 0.07).toFixed(3);
  const sB = (0.005 + k * 0.025).toFixed(3);
  const bA = (0.03 + k * 0.13).toFixed(3);
  const hl = (0.02 + k * 0.08).toFixed(3);
  const surf = T.surface;

  const shadowCol = T.isDark ? "0,0,0" : "15,23,42";
  const cardAlphaA = T.isDark ? sA : Math.min(1, +sA + 0.6);
  const cardAlphaB = T.isDark ? sB : Math.min(1, +sB + 0.55);

  const css = `
    body.ws-body {
      background: ${T.ambient} !important;
      background-attachment: fixed !important;
      color: ${T.text};
      --bg: ${T.bg};
      --text: ${T.text};
      --text-2: ${T.text2};
      --text-3: ${T.text3};
      --border: ${T.border};
      --border-soft: ${T.border};
      --card: ${T.card};
      --card-hover: ${T.card};
      --primary: ${T.primary};
      --primary-soft: rgba(${T.primaryRgb},0.14);
      --primary-line: rgba(${T.primaryRgb},0.32);
      --teal: ${T.teal};
      --teal-soft: rgba(${T.tealRgb},0.12);
      --teal-line: rgba(${T.tealRgb},0.32);
    }

    /* Density */
    .ws-hero h1 { font-size: ${D.heroFont} !important; margin-bottom: ${D.heroMb} !important; color: ${T.text} !important; }
    .ws-main-inner { padding: ${D.heroPad} !important; }
    .ws-cmd { margin-bottom: ${D.cmdMb} !important; }
    .ws-quick { margin-bottom: ${D.quickMb} !important; }
    .ws-quick-grid { gap: ${D.quickGap} !important; }
    .ws-quick-card { padding: ${D.quickPad} !important; }
    .ws-lede, .ws-quick-card .qc-desc, .ws-id-text .s, .ws-task .d, .ws-kb-list li, .ws-empty p, .ws-empty-tips li { color: ${T.text2} !important; }
    .ws-eyebrow, .ws-cmd-tag, .ws-section-title, .ws-count, .ws-quick-card .qc-head, .ws-task .num, .ws-quick-sub, .ws-kb-list small, .ws-main-foot, .panel-q-meta, .ws-panel .crumb, .ws-panel .panel-foot { color: ${T.text3} !important; }

    /* Sidebar */
    .ws-sidebar {
      background: ${T.isDark
        ? `linear-gradient(180deg, rgba(${surf},${sA}) 0%, rgba(${surf},${sB}) 100%), ${T.sidebar}`
        : `${T.sidebar}`} !important;
      border-color: ${T.border} !important;
      backdrop-filter: blur(${blur}px) saturate(${sat}%) !important;
      -webkit-backdrop-filter: blur(${blur}px) saturate(${sat}%) !important;
      box-shadow:
        inset 0 1px 0 rgba(${surf},${hl}),
        0 30px 60px -30px rgba(${shadowCol},${T.isDark ? 0.65 : 0.1}),
        0 0 0 1px rgba(${shadowCol},${T.isDark ? 0.18 : 0.03}) !important;
    }

    /* Right panel */
    .ws-panel {
      background: ${T.isDark
        ? `linear-gradient(180deg, rgba(${surf},${sA}) 0%, rgba(${surf},${sB}) 100%), ${T.panel}`
        : `${T.panel}`} !important;
      border-color: ${T.border} !important;
      backdrop-filter: blur(${blur}px) saturate(${sat}%) !important;
      -webkit-backdrop-filter: blur(${blur}px) saturate(${sat}%) !important;
      box-shadow:
        inset 0 1px 0 rgba(${surf},${hl}),
        0 30px 60px -30px rgba(${shadowCol},${T.isDark ? 0.65 : 0.12}),
        0 0 0 1px rgba(${shadowCol},${T.isDark ? 0.18 : 0.03}) !important;
    }

    /* Quick cards */
    .ws-quick-card {
      background: ${T.isDark
        ? `linear-gradient(180deg, rgba(${surf},${(+sA + 0.02).toFixed(3)}) 0%, rgba(${surf},${sB}) 100%), ${T.card}`
        : `${T.card}`} !important;
      border-color: ${T.border} !important;
      backdrop-filter: blur(${(blur * 0.9).toFixed(1)}px) saturate(${sat}%) !important;
      -webkit-backdrop-filter: blur(${(blur * 0.9).toFixed(1)}px) saturate(${sat}%) !important;
      box-shadow:
        inset 0 1px 0 rgba(${surf},${hl}),
        0 14px 28px -16px rgba(${shadowCol},${T.isDark ? 0.55 : 0.08}) !important;
      color: ${T.text} !important;
    }
    .ws-quick-card .qc-title { color: ${T.text} !important; }
    .ws-quick-card:hover { border-color: rgba(${T.primaryRgb},0.4) !important; }

    /* Command input */
    .ws-cmd {
      background: ${T.isDark
        ? `linear-gradient(180deg, rgba(${surf},${sA}) 0%, rgba(${surf},${sB}) 100%), ${T.card}`
        : `${T.card}`} !important;
      border-color: ${T.border} !important;
      backdrop-filter: blur(${blur}px) saturate(${sat}%) !important;
      -webkit-backdrop-filter: blur(${blur}px) saturate(${sat}%) !important;
      box-shadow:
        inset 0 1px 0 rgba(${surf},${hl}),
        0 16px 40px -20px rgba(${shadowCol},${T.isDark ? 0.6 : 0.1}) !important;
    }
    .ws-cmd input { color: ${T.text} !important; }
    .ws-cmd-tag { border-right-color: ${T.border} !important; }
    .ws-cmd:focus-within {
      border-color: rgba(${T.primaryRgb},0.5) !important;
      box-shadow:
        inset 0 1px 0 rgba(${surf},${hl}),
        0 0 0 4px ${T.glow},
        0 16px 40px -20px rgba(${shadowCol},0.5) !important;
    }
    .ws-cmd-send { background: ${T.primary} !important; }
    .ws-cmd-send svg { stroke: ${T.sendInk} !important; }
    .ws-cmd-send:hover { filter: brightness(1.08); }

    /* Borders for everything else */
    .ws-brand, .ws-section, .ws-foot, .ws-main-foot, .ws-panel .panel-head, .ws-panel .panel-foot, .ws-eyebrow, .ws-cmd-key, .ws-id, .ws-id kbd, .ws-empty-tips li, .ws-panel .icon-btn, .ws-panel .panel-foot .ghost { border-color: ${T.border} !important; }

    /* Accent surfaces */
    .ws-id.active, .ws-task.is-active, .ws-quick-card.is-start {
      background: rgba(${T.primaryRgb},${T.isDark ? 0.14 : 0.07}) !important;
      border-color: rgba(${T.primaryRgb},0.36) !important;
    }
    .ws-id.active .ws-id-icon { background: rgba(${T.primaryRgb},0.18) !important; border-color: rgba(${T.primaryRgb},0.36) !important; }

    /* Primary text accents */
    .v0-pill { color: ${T.primary} !important; border-color: rgba(${T.primaryRgb},0.32) !important; background: rgba(${T.primaryRgb},${T.isDark ? 0.1 : 0.06}) !important; }
    .v0-pill .d { background: ${T.primary} !important; }
    .ws-task.is-active .num, .ws-quick-card .qc-num, .ws-quick-card .qc-foot .arr,
    .ws-panel .ans-block h4 .num, .ws-panel .template-head .label .who,
    .ws-panel .tldr strong, .ws-panel .sources .src-icon, .ws-empty-tips .n { color: ${T.primary} !important; }
    .ws-hero h1 .accent { color: ${T.primary} !important; -webkit-text-fill-color: ${T.primary} !important; background: none !important; }

    /* Buttons & badges */
    .ws-quick-card.is-start::after,
    .ws-panel .template-head .copy-btn,
    .ws-task .badge { background: ${T.primary} !important; color: ${T.sendInk} !important; }
    .ws-panel .template-head .copy-btn.copied { background: ${T.teal} !important; }

    /* Teal accents */
    .ws-eyebrow .dot, .ws-kb-list .kb-dot { background: ${T.teal} !important; box-shadow: 0 0 0 3px rgba(${T.tealRgb},0.2) !important; }
    .ws-panel .tldr { background: rgba(${T.primaryRgb},${T.isDark ? 0.1 : 0.06}) !important; border-color: rgba(${T.primaryRgb},0.22) !important; }
    .ws-panel .template-body .var { background: rgba(${T.tealRgb},${T.isDark ? 0.18 : 0.1}) !important; color: ${T.teal} !important; border: 1px solid rgba(${T.tealRgb},0.32) !important; }

    /* Empty orb */
    .ws-empty-orb span { border-color: rgba(${T.primaryRgb},0.28) !important; }
    .ws-empty-orb span:nth-child(3) {
      background: radial-gradient(circle at 35% 30%, ${T.primary} 0%, rgba(${T.primaryRgb},0.6) 60%, ${T.bg} 100%) !important;
      box-shadow: 0 0 60px rgba(${T.primaryRgb},0.45) !important;
    }

    /* Inner ans-block micro cards */
    .ws-panel .ans-block { background: rgba(${surf},${T.isDark ? 0.025 : 0}) !important; border-color: ${T.border} !important; }
    .ws-panel .ans-block h4 .num { background: rgba(${T.primaryRgb},0.16) !important; border-color: rgba(${T.primaryRgb},0.32) !important; }
    .ws-panel .ans-block h4 .num.teal { background: rgba(${T.tealRgb},0.16) !important; border-color: rgba(${T.tealRgb},0.32) !important; color: ${T.teal} !important; }
    .ws-panel .sources a { background: rgba(${surf},${T.isDark ? 0.03 : 0}) !important; border-color: ${T.border} !important; color: ${T.text} !important; }
    .ws-panel .checklist .step { background: rgba(${surf},${T.isDark ? 0.04 : 0}) !important; border-color: ${T.border} !important; color: ${T.text2} !important; }
    .ws-panel .panel-q { color: ${T.text} !important; }
    .ws-panel .template { background: rgba(${surf},${T.isDark ? 0.025 : 0}) !important; border-color: ${T.border} !important; }
    .ws-panel .template-head { background: rgba(${surf},${T.isDark ? 0.025 : 0}) !important; border-bottom-color: ${T.border} !important; }
    .ws-panel .crumb b, .ws-empty h4, .ws-quick-head h3 { color: ${T.text} !important; }
  `;

  let tag = document.getElementById("tweak-runtime-style");
  if (!tag) { tag = document.createElement("style"); tag.id = "tweak-runtime-style"; document.head.appendChild(tag); }
  tag.textContent = css;
}

function App() {
  const [t, set] = useTweaks(/*EDITMODE-BEGIN*/{
    "theme": "dark",
    "glass": 55,
    "density": "regular"
  }/*EDITMODE-END*/);

  useEffect(() => { applyTweaks(t); }, [t.theme, t.glass, t.density]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="主题">
        <TweakRadio
          label="明暗"
          value={t.theme}
          options={[
            { value: "dark", label: "暗色" },
            { value: "light", label: "浅色" }
          ]}
          onChange={v => set("theme", v)}
        />
      </TweakSection>

      <TweakSection label="玻璃">
        <TweakSlider
          label="雾面浓度"
          value={t.glass}
          min={0} max={100} step={1} unit="%"
          onChange={v => set("glass", v)}
        />
      </TweakSection>

      <TweakSection label="节奏">
        <TweakRadio
          label="呼吸感"
          value={t.density}
          options={[
            { value: "compact", label: "紧凑" },
            { value: "regular", label: "舒展" },
            { value: "airy", label: "大开间" }
          ]}
          onChange={v => set("density", v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

const mount = document.createElement("div");
document.body.appendChild(mount);
ReactDOM.createRoot(mount).render(<App />);
