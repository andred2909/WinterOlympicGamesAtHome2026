import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

// ─── TYPES ─────────────────────────────────────────────────────────────────────

interface Player {
  id: number;
  name: string;
  character: string;
  nation: string;
}

interface Event {
  id: string;
  name: string;
  icon: string;
  double?: boolean;
}

interface BonusRule {
  id: string;
  name: string;
  pts: number;
  desc: string;
  when: string;
}

type Results = Record<string, Record<number, number>>;
type Bonuses = Record<number, Record<string, number>>;

interface AppState {
  players: Player[];
  results: Results;
  bonuses: Bonuses;
  selectedEvents: string[];
  phase: "setup" | "playing" | "finished";
}

interface RankedPlayer extends Player {
  eventPts: number;
  bonusPts: number;
  total: number;
  medals: { gold: number; silver: number; bronze: number };
}

// ─── DATA ──────────────────────────────────────────────────────────────────────

const CHARACTERS: string[] = [
  "Mario","Luigi","Peach","Daisy","Wario","Waluigi","Yoshi","Birdo",
  "Bowser","Bowser Jr.","DK","Diddy Kong","Koopa","Boo",
  "Sonic","Tails","Knuckles","Amy","Shadow","Silver","Blaze","Vector","Cream","Dr. Eggman",
];

const NATIONS: string[] = [
  "🇮🇹 Italia","🇯🇵 Giappone","🇺🇸 USA","🇩🇪 Germania","🇫🇷 Francia",
  "🇬🇧 UK","🇨🇦 Canada","🇦🇺 Australia","🇧🇷 Brasile","🇰🇷 Corea",
  "🇳🇴 Norvegia","🇸🇪 Svezia","🇨🇭 Svizzera","🇦🇹 Austria","🇳🇱 Olanda",
];

const EVENTS: Event[] = [
  { id: "ski_jump",  name: "Salto con gli Sci",    icon: "🎿" },
  { id: "bobsleigh", name: "Bob",                   icon: "🛷" },
  { id: "curling",   name: "Curling",               icon: "🥌" },
  { id: "figure",    name: "Pattinaggio di Figura", icon: "🩰" },
  { id: "hockey",    name: "Hockey su Ghiaccio",    icon: "🏒" },
  { id: "dream",     name: "Dream Snowboard Cross", icon: "🏂", double: true },
];

const MEDAL_POINTS: Record<number, number> = { 1: 5, 2: 3, 3: 2, 4: 1 };
const MEDAL_EMOJI:  Record<number, string>  = { 1: "🥇", 2: "🥈", 3: "🥉", 4: "4°", 5: "5°", 6: "6°", 7: "7°", 8: "8°" };

const BONUS_RULES: BonusRule[] = [
  { id: "simpatia",   name: "🎭 Premio Simpatia",      pts: 3, desc: "Votato da tutti a fine serata. Chi ha fatto ridere di più?",                   when: "Fine serata"    },
  { id: "fedele",     name: "🏳️ Fedele alla Nazione",  pts: 1, desc: "Per evento: il tuo personaggio ha un legame tematico con la nazione scelta.",  when: "Ogni evento"    },
  { id: "ironman",    name: "💀 Iron Man",              pts: 2, desc: "Rivelato a metà serata: non sei mai arrivato ultimo fino a quel momento.",     when: "Metà serata"    },
  { id: "specialist", name: "🎯 Specialista",           pts: 2, desc: "Rivelato a metà serata: il punteggio più alto in un singolo evento.",          when: "Metà serata"    },
  { id: "ghiaccio",   name: "🧊 Cuore di Ghiaccio",    pts: 1, desc: "Rivelato a metà serata: non hai mai esultato/imprecato ad alta voce.",         when: "Metà serata"    },
  { id: "fairplay",   name: "🤝 Fair Play",             pts: 1, desc: "Assegnato dagli altri giocatori a chi ha perso con più stile.",                when: "Fine serata"    },
  { id: "momento",    name: "⚡ Momento Olimpico",      pts: 1, desc: "Assegnabile dal MC in tempo reale: la giocata/reazione più memorabile.",       when: "In tempo reale" },
];

const STORAGE_KEY    = "mario_sonic_torneo_v3";
const ADMIN_PASSWORD = "Olympics!!21022026";
//const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const INITIAL_STATE: AppState = {
  players: [],
  results: {},
  bonuses: {},
  selectedEvents: EVENTS.map(e => e.id),
  phase: "setup",
};

// ─── UTILS ─────────────────────────────────────────────────────────────────────

function calcScores(players: Player[], results: Results, bonuses: Bonuses): RankedPlayer[] {
  return players.map(p => {
    let eventPts = 0;
    const medals = { gold: 0, silver: 0, bronze: 0 };
    Object.entries(results).forEach(([eid, eventRes]) => {
      const ev         = EVENTS.find(e => e.id === eid);
      const multiplier = ev?.double ? 2 : 1;
      const place      = eventRes[p.id];
      if (place) {
        eventPts += (MEDAL_POINTS[place] ?? 0) * multiplier;
        if      (place === 1) medals.gold++;
        else if (place === 2) medals.silver++;
        else if (place === 3) medals.bronze++;
      }
    });
    const bonusPts = Object.values(bonuses[p.id] ?? {}).reduce((a: number, b: number) => a + b, 0);
    return { ...p, eventPts, bonusPts, total: eventPts + bonusPts, medals };
  }).sort((a, b) =>
    b.total - a.total || b.medals.gold - a.medals.gold || b.medals.silver - a.medals.silver
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────────

const G = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #040d1c 0%, #091830 45%, #0d2244 70%, #081525 100%)",
    fontFamily: "'Exo 2', 'Segoe UI', sans-serif",
    color: "#e8f4ff",
    paddingBottom: 60,
  } as CSSProperties,
  panel: {
    background: "rgba(8,25,55,0.82)",
    border: "1px solid rgba(0,210,255,0.18)",
    borderRadius: 20,
    backdropFilter: "blur(18px)",
    padding: "24px 28px",
    marginBottom: 18,
    boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
  } as CSSProperties,
  btn: (color = "#00cfff", size: "sm" | "md" = "md"): CSSProperties => ({
    background: `linear-gradient(135deg, ${color}, ${color}99)`,
    border: "none",
    borderRadius: size === "sm" ? 8 : 12,
    color: "#fff",
    fontFamily: "inherit",
    fontWeight: 700,
    fontSize: size === "sm" ? 12 : 14,
    letterSpacing: "0.5px",
    padding: size === "sm" ? "6px 14px" : "12px 24px",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: `0 4px 16px ${color}44`,
  }),
  input: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(0,210,255,0.2)",
    borderRadius: 10,
    color: "#e8f4ff",
    fontFamily: "inherit",
    fontSize: 14,
    padding: "10px 14px",
    outline: "none",
    width: "100%",
  } as CSSProperties,
  select: {
    background: "rgba(5,15,40,0.9)",
    border: "1px solid rgba(0,210,255,0.25)",
    borderRadius: 10,
    color: "#e8f4ff",
    fontFamily: "inherit",
    fontSize: 13,
    padding: "10px 14px",
    outline: "none",
    width: "100%",
  } as CSSProperties,
  label: {
    fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase" as const,
    color: "#6ab0d4", marginBottom: 6, display: "block",
  } as CSSProperties,
  sectionTitle: {
    fontFamily: "'Bebas Neue', 'Impact', sans-serif",
    fontSize: 20, letterSpacing: 2, color: "#00cfff",
    marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
  } as CSSProperties,
};

// ─── SNOW (fiocchi deterministici per evitare Math.random nel render) ──────────

const FLAKES = Array.from({ length: 28 }, (_, i) => ({
  id:      i,
  left:    (i * 37.3)  % 100,
  size:    6  + (i * 7.1)  % 12,
  dur:     6  + (i * 3.7)  % 8,
  delay:   (i * 2.9)  % 8,
  opacity: 0.2 + (i * 0.019) % 0.5,
}));

function Snow() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {FLAKES.map(f => (
        <div key={f.id} style={{
          position: "absolute", left: `${f.left}%`, top: "-20px",
          fontSize: `${f.size}px`, opacity: f.opacity,
          animation: `snowfall ${f.dur}s linear ${f.delay}s infinite`,
        }}>❄</div>
      ))}
    </div>
  );
}

// ─── HEADER ────────────────────────────────────────────────────────────────────

interface HeaderProps { onTabChange: (tab: string) => void; tab: string; }

function Header({ onTabChange, tab }: HeaderProps) {
  const tabs = [
    { id: "leaderboard", label: "🏆 Classifica" },
    { id: "events",      label: "🎿 Eventi"      },
    { id: "rules",       label: "📜 Regole"      },
    { id: "admin",       label: "⚙️ Admin"       },
  ];
  return (
    <header style={{ textAlign: "center", padding: "36px 16px 0", position: "relative", zIndex: 1 }}>
      <div style={{ fontSize: 26, letterSpacing: 6, marginBottom: 6, opacity: 0.85 }}>🔵🟡🔴🟢⚫</div>
      <h1 style={{
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        fontSize: "clamp(38px, 9vw, 88px)", lineHeight: 0.9, letterSpacing: 3,
        background: "linear-gradient(135deg, #fff 0%, #00cfff 35%, #ffd700 65%, #fff 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        filter: "drop-shadow(0 0 30px rgba(0,207,255,0.35))", marginBottom: 8,
      }}>
        MARIO & SONIC<br />WINTER OLYMPICS
      </h1>
      <div style={{ fontSize: 12, letterSpacing: 6, color: "#00cfff", fontWeight: 700, textTransform: "uppercase", opacity: 0.75 }}>
        Torneo Olimpico — Milano Cortina 2026
      </div>
      <div style={{
        display: "inline-block", background: "linear-gradient(135deg, #ffd700, #ff8c00)",
        color: "#060d1c", fontWeight: 900, fontSize: 10, letterSpacing: 3,
        padding: "5px 18px", borderRadius: 20, marginTop: 12, textTransform: "uppercase",
      }}>⛷️ Nintendo Wii Edition</div>

      <div style={{
        display: "flex", gap: 4, marginTop: 28,
        background: "rgba(0,0,0,0.35)", padding: 6, borderRadius: 16,
        border: "1px solid rgba(0,210,255,0.15)", overflowX: "auto",
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => onTabChange(t.id)} style={{
            flex: 1, minWidth: 100, padding: "11px 14px", border: "none", borderRadius: 11,
            background: tab === t.id ? "linear-gradient(135deg, #00cfff, #007aaa)" : "transparent",
            color: tab === t.id ? "#fff" : "rgba(255,255,255,0.45)",
            fontFamily: "inherit", fontWeight: 700, fontSize: 12,
            cursor: "pointer", transition: "all 0.22s", textTransform: "uppercase", whiteSpace: "nowrap",
            boxShadow: tab === t.id ? "0 4px 18px rgba(0,207,255,0.35)" : "none",
          }}>{t.label}</button>
        ))}
      </div>
    </header>
  );
}

// ─── SETUP PANEL ───────────────────────────────────────────────────────────────

interface PanelProps { state: AppState; setState: (fn: (s: AppState) => AppState) => void; }

function SetupPanel({ state, setState }: PanelProps) {
  const [newName,   setNewName]   = useState("");
  const [newChar,   setNewChar]   = useState(CHARACTERS[0]);
  const [newNation, setNewNation] = useState(NATIONS[0]);

  const addPlayer = () => {
    if (!newName.trim() || state.players.length >= 8) return;
    const id = Date.now();
    setState(s => ({
      ...s,
      players: [...s.players, { id, name: newName.trim(), character: newChar, nation: newNation }],
      bonuses: { ...s.bonuses, [id]: {} },
    }));
    setNewName("");
  };

  const removePlayer = (id: number) =>
    setState(s => ({ ...s, players: s.players.filter(p => p.id !== id) }));

  const startTournament = () => {
    if (state.players.length < 2) return;
    setState(s => ({ ...s, phase: "playing" }));
  };

  return (
    <div>
      <div style={G.panel}>
        <div style={G.sectionTitle}>👤 Aggiungi Giocatori ({state.players.length}/8)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, marginBottom: 14, alignItems: "end" }}>
          <div>
            <label style={G.label}>Nome</label>
            <input style={G.input} value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addPlayer()}
              placeholder="Nome giocatore..." maxLength={16} />
          </div>
          <div>
            <label style={G.label}>Personaggio</label>
            <select style={G.select} value={newChar} onChange={e => setNewChar(e.target.value)}>
              {CHARACTERS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={G.label}>Nazione</label>
            <select style={G.select} value={newNation} onChange={e => setNewNation(e.target.value)}>
              {NATIONS.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <button style={{ ...G.btn("#00cfff"), whiteSpace: "nowrap" }} onClick={addPlayer}>+ Aggiungi</button>
        </div>

        {state.players.map((p, i) => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 8,
            background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 16px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#00cfff", width: 28 }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "#6ab0d4" }}>{p.character} · {p.nation}</div>
            </div>
            <button onClick={() => removePlayer(p.id)} style={{ ...G.btn("#ff4466", "sm"), padding: "5px 10px" }}>✕</button>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <button onClick={startTournament} disabled={state.players.length < 2} style={{
          ...G.btn("#ffd700"), fontSize: 16, padding: "16px 48px",
          color: "#060d1c", fontWeight: 900,
          opacity: state.players.length < 2 ? 0.4 : 1,
        }}>🏁 INIZIA IL TORNEO</button>
        {state.players.length < 2 && (
          <div style={{ color: "#ff6688", fontSize: 12, marginTop: 8 }}>Aggiungi almeno 2 giocatori</div>
        )}
      </div>
    </div>
  );
}

// ─── RESULTS PANEL ─────────────────────────────────────────────────────────────

function ResultsPanel({ state, setState }: PanelProps) {
  const [selEvent, setSelEvent] = useState<string>(state.selectedEvents[0] ?? "");

  const setPlace = (eventId: string, playerId: number, place: number) => {
    setState(s => {
      const res: Record<number, number> = { ...(s.results[eventId] ?? {}) };
      // rimuovi chiunque avesse già quel piazzamento
      (Object.keys(res) as unknown as number[]).forEach(pid => {
        if (res[Number(pid)] === place) delete res[Number(pid)];
      });
      if (place === 0) delete res[playerId];
      else res[playerId] = place;
      return { ...s, results: { ...s.results, [eventId]: res } };
    });
  };

  const toggleBonus = (playerId: number, bonusId: string, pts: number) => {
    setState(s => {
      const pb = { ...(s.bonuses[playerId] ?? {}) };
      if (pb[bonusId]) delete pb[bonusId];
      else pb[bonusId] = pts;
      return { ...s, bonuses: { ...s.bonuses, [playerId]: pb } };
    });
  };

  const ev       = EVENTS.find(e => e.id === selEvent);
  const eventRes = state.results[selEvent] ?? {};

  return (
    <div>
      <div style={G.panel}>
        <div style={G.sectionTitle}>🎿 Inserisci Risultati Evento</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {state.selectedEvents.map(eid => {
            const e    = EVENTS.find(x => x.id === eid);
            const done = Object.keys(state.results[eid] ?? {}).length > 0;
            return (
              <button key={eid} onClick={() => setSelEvent(eid)} style={{
                padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                border:      selEvent === eid ? "1px solid #00cfff" : "1px solid rgba(255,255,255,0.1)",
                background:  selEvent === eid ? "rgba(0,207,255,0.18)" : "rgba(255,255,255,0.04)",
                color:       selEvent === eid ? "#fff" : "rgba(255,255,255,0.5)",
                fontFamily:  "inherit", fontSize: 13, fontWeight: selEvent === eid ? 700 : 400,
                transition:  "all 0.2s", position: "relative",
              }}>
                {e?.icon} {e?.name}
                {e?.double && <span style={{ marginLeft: 8, fontSize: 10, background: "rgba(255,215,0,0.2)", color: "#ffd700", borderRadius: 6, padding: "2px 7px", fontWeight: 800 }}>×2</span>}
                {done      && <span style={{ position: "absolute", top: -4, right: -4, background: "#00ff88", borderRadius: "50%", width: 10, height: 10, display: "block" }} />}
              </button>
            );
          })}
        </div>

        {selEvent && ev && (
          <div>
            <div style={{ fontSize: 14, color: "#6ab0d4", marginBottom: 14 }}>
              Assegna i piazzamenti per <strong style={{ color: "#fff" }}>{ev.icon} {ev.name}</strong>
              {ev.double && <span style={{ marginLeft: 10, fontSize: 11, background: "rgba(255,215,0,0.2)", color: "#ffd700", borderRadius: 6, padding: "3px 9px", fontWeight: 800 }}>✨ PUNTI DOPPI</span>}
            </div>
            {state.players.map(p => {
              const curPlace = eventRes[p.id];
              return (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
                  background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px 14px",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#6ab0d4" }}>{p.character}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {Array.from({ length: state.players.length }, (_, i) => i + 1).map(place => (
                      <button key={place} onClick={() => setPlace(selEvent, p.id, curPlace === place ? 0 : place)} style={{
                        width: 34, height: 34, borderRadius: 8, border: "none", cursor: "pointer",
                        background: curPlace === place
                          ? (place === 1 ? "#ffd700" : place === 2 ? "#c0c0c0" : place === 3 ? "#cd7f32" : "rgba(0,207,255,0.5)")
                          : "rgba(255,255,255,0.08)",
                        color:       curPlace === place ? (place <= 3 ? "#000" : "#fff") : "rgba(255,255,255,0.4)",
                        fontWeight:  800, fontSize: 13, fontFamily: "inherit", transition: "all 0.15s",
                      }}>
                        {MEDAL_EMOJI[place]}
                      </button>
                    ))}
                  </div>
                  {curPlace && (
                    <div style={{ fontSize: 11, color: "#00ff88", fontWeight: 700, minWidth: 50, textAlign: "right" }}>
                      +{(MEDAL_POINTS[curPlace] ?? 0) * (ev.double ? 2 : 1)}pt
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bonus */}
      <div style={G.panel}>
        <div style={G.sectionTitle}>⭐ Assegna Bonus</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 10px", color: "#6ab0d4", fontWeight: 600, fontSize: 11 }}>BONUS</th>
                {state.players.map(p => (
                  <th key={p.id} style={{ padding: "8px 10px", color: "#6ab0d4", fontWeight: 600, fontSize: 11, textAlign: "center" }}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BONUS_RULES.map(b => (
                <tr key={b.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "10px", minWidth: 160 }}>
                    <div style={{ fontWeight: 600 }}>{b.name}</div>
                    <div style={{ fontSize: 10, color: "#6ab0d4", marginTop: 2 }}>+{b.pts}pt · {b.when}</div>
                  </td>
                  {state.players.map(p => {
                    const active = !!(state.bonuses[p.id]?.[b.id]);
                    return (
                      <td key={p.id} style={{ textAlign: "center", padding: "10px" }}>
                        <button onClick={() => toggleBonus(p.id, b.id, b.pts)} style={{
                          width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer",
                          background: active ? "linear-gradient(135deg,#00ff88,#00cc66)" : "rgba(255,255,255,0.07)",
                          color:      active ? "#000" : "rgba(255,255,255,0.3)",
                          fontSize: 14, fontWeight: 800, transition: "all 0.2s",
                          boxShadow: active ? "0 0 12px rgba(0,255,136,0.4)" : "none",
                        }}>{active ? "✓" : "○"}</button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── LEADERBOARD ───────────────────────────────────────────────────────────────

function Leaderboard({ state }: { state: AppState }) {
  const ranked  = calcScores(state.players, state.results, state.bonuses);
  const maxPts  = ranked[0]?.total || 1;

  if (ranked.length === 0) {
    return (
      <div style={{ ...G.panel, textAlign: "center", padding: "60px 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏔️</div>
        <div style={{ color: "#6ab0d4", fontSize: 16 }}>
          Nessun giocatore ancora.<br />Vai su <strong style={{ color: "#00cfff" }}>Admin → Setup Giocatori</strong> per iniziare!
        </div>
      </div>
    );
  }

  const podiumOrder = [ranked[1], ranked[0], ranked[2]].filter(Boolean) as RankedPlayer[];
  const podiumCfg   = [
    { h: 110, bg: "#c0c0c0", emoji: "🥈" },
    { h: 145, bg: "#ffd700", emoji: "🥇" },
    { h:  90, bg: "#cd7f32", emoji: "🥉" },
  ];

  return (
    <div>
      {ranked.length >= 3 && (
        <div style={G.panel}>
          <div style={G.sectionTitle}>🏅 Podio</div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12 }}>
            {podiumOrder.map((p, i) => {
              const cfg = podiumCfg[i];
              return (
                <div key={p.id} style={{ textAlign: "center", flex: 1, maxWidth: 200 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#6ab0d4", marginBottom: 8 }}>{p.character}</div>
                  <div style={{
                    height: cfg.h,
                    background: `linear-gradient(180deg, ${cfg.bg}33, ${cfg.bg}11)`,
                    border: `2px solid ${cfg.bg}66`, borderRadius: "12px 12px 0 0",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                  }}>
                    <div style={{ fontSize: 28 }}>{cfg.emoji}</div>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: cfg.bg, lineHeight: 1 }}>{p.total}</div>
                    <div style={{ fontSize: 10, color: "#6ab0d4" }}>punti</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={G.panel}>
        <div style={G.sectionTitle}>🏆 Classifica Completa</div>
        {ranked.map((p, i) => {
          const pct = (p.total / maxPts) * 100;
          return (
            <div key={p.id} style={{
              background: i === 0 ? "rgba(255,215,0,0.08)" : i === 1 ? "rgba(192,192,192,0.05)" : i === 2 ? "rgba(205,127,50,0.05)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${i === 0 ? "rgba(255,215,0,0.25)" : i === 1 ? "rgba(192,192,192,0.15)" : i === 2 ? "rgba(205,127,50,0.15)" : "rgba(255,255,255,0.05)"}`,
              borderRadius: 14, padding: "14px 18px", position: "relative", overflow: "hidden", marginBottom: 8,
            }}>
              <div style={{
                position: "absolute", left: 0, bottom: 0, height: 2, width: `${pct}%`,
                background: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#00cfff",
                opacity: 0.6, transition: "width 0.5s",
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, lineHeight: 1, width: 36, textAlign: "center",
                  color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "rgba(255,255,255,0.3)",
                  textShadow: i === 0 ? "0 0 20px rgba(255,215,0,0.5)" : "none",
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#00cfff", fontWeight: 600 }}>{p.character} · {p.nation}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {p.medals.gold   > 0 && <span style={{ fontSize: 11, background: "rgba(255,215,0,0.15)",  borderRadius: 6, padding: "2px 7px", color: "#ffd700" }}>🥇×{p.medals.gold}</span>}
                      {p.medals.silver > 0 && <span style={{ fontSize: 11, background: "rgba(192,192,192,0.1)", borderRadius: 6, padding: "2px 7px", color: "#ccc"    }}>🥈×{p.medals.silver}</span>}
                      {p.medals.bronze > 0 && <span style={{ fontSize: 11, background: "rgba(205,127,50,0.1)",  borderRadius: 6, padding: "2px 7px", color: "#cd7f32" }}>🥉×{p.medals.bronze}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 38, lineHeight: 1, color: "#fff" }}>{p.total}</div>
                  <div style={{ fontSize: 10, color: "#6ab0d4", letterSpacing: 1 }}>
                    {p.eventPts}ev {p.bonusPts > 0 ? `+${p.bonusPts}bo` : ""}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── EVENTS TABLE ──────────────────────────────────────────────────────────────

function EventsTable({ state }: { state: AppState }) {
  const getPlayerName = (id: number) => state.players.find(p => p.id === id)?.name ?? "?";

  if (state.selectedEvents.length === 0)
    return <div style={{ ...G.panel, textAlign: "center", padding: "50px", color: "#6ab0d4" }}>Nessun evento selezionato.</div>;

  return (
    <div>
      {state.selectedEvents.map(eid => {
        const ev         = EVENTS.find(e => e.id === eid);
        const res        = state.results[eid] ?? {};
        const hasResults = Object.keys(res).length > 0;
        const sorted     = (Object.entries(res) as [string, number][]).sort((a, b) => a[1] - b[1]);
        return (
          <div key={eid} style={G.panel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2, color: hasResults ? "#fff" : "#6ab0d4" }}>
                {ev?.icon} {ev?.name}
                {ev?.double && <span style={{ marginLeft: 10, fontSize: 11, fontFamily: "inherit", background: "rgba(255,215,0,0.2)", color: "#ffd700", borderRadius: 6, padding: "3px 9px", fontWeight: 800, letterSpacing: 0 }}>×2 punti</span>}
              </div>
              <div style={{
                fontSize: 10, letterSpacing: 2, textTransform: "uppercase", padding: "4px 12px", borderRadius: 20, fontWeight: 700,
                background: hasResults ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.06)",
                color:      hasResults ? "#00ff88" : "rgba(255,255,255,0.3)",
                border:     `1px solid ${hasResults ? "rgba(0,255,136,0.25)" : "rgba(255,255,255,0.08)"}`,
              }}>{hasResults ? "✓ Completato" : "In attesa"}</div>
            </div>
            {hasResults ? (
              sorted.map(([pid, place]) => (
                <div key={pid} style={{
                  display: "flex", alignItems: "center", gap: 12, marginBottom: 7,
                  padding: "9px 14px", borderRadius: 10,
                  background: place === 1 ? "rgba(255,215,0,0.1)" : place === 2 ? "rgba(192,192,192,0.06)" : place === 3 ? "rgba(205,127,50,0.06)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${place === 1 ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.05)"}`,
                }}>
                  <span style={{ fontSize: 18, minWidth: 28 }}>{MEDAL_EMOJI[place]}</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{getPlayerName(Number(pid))}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#00cfff", fontWeight: 700 }}>
                    +{(MEDAL_POINTS[place] ?? 0) * (ev?.double ? 2 : 1)}pt
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>Nessun risultato ancora.</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── RULES ─────────────────────────────────────────────────────────────────────

function Rules() {
  const generalRules: [string, string][] = [
    ["👤 Personaggio fisso", "Ogni giocatore sceglie UN solo personaggio e lo usa per tutta la serata. Mii non validi."],
    ["🏳️ Nazione",           "Ogni giocatore rappresenta una nazione. Può dare diritto al bonus Fedele alla Nazione."],
    ["🎮 Controller",        "2-4 controller a rotazione. Il MC gestisce i turni."],
    ["🏅 Medaglie in gioco", "Nei giochi Wii le medaglie contano: Oro = 5pt, Argento = 3pt, Bronzo = 2pt, 4° = 1pt."],
    ["🏂 Dream Snowboard",   "L'evento Dream Snowboard Cross vale PUNTI DOPPI su tutti i piazzamenti."],
    ["🎭 MC",                "Il Mastro delle Cerimonie non gioca ufficialmente ma commenta, gestisce i turni e assegna bonus spot."],
  ];

  const schedule: [string, string, string][] = [
    ["21:00", "Cerimonia d'apertura",          "Scelta personaggio + nazione + drink di benvenuto"],
    ["21:15", "Evento 1 — Salto con gli Sci",  "Riscaldamento: facile da capire, grande spettacolo"],
    ["21:35", "Evento 2 — Bob",                ""],
    ["21:55", "Evento 3 — Curling",            "Pausa — classifica intermedia + snack"],
    ["22:15", "⚡ Rivelazione bonus segreti",  "Iron Man, Specialista, Cuore di Ghiaccio vengono svelati!"],
    ["22:20", "Evento 4 — Pattinaggio",        ""],
    ["22:40", "Evento 5 — Hockey su Ghiaccio", ""],
    ["23:00", "🏂 FINALE — Dream Snowboard",   "PUNTI DOPPI! L'evento più importante della serata"],
    ["23:20", "🏆 Cerimonia di chiusura",       "Classifica finale + podio + premi"],
  ];

  const pts: [string, string, string][] = [
    ["🥇 1°", "5 pt",  "#ffd700"],
    ["🥈 2°", "3 pt",  "#c0c0c0"],
    ["🥉 3°", "2 pt",  "#cd7f32"],
    ["4°",    "1 pt",  "#6ab0d4"],
    ["5°+",   "0 pt",  "#444"   ],
  ];

  return (
    <div>
      <div style={G.panel}>
        <div style={G.sectionTitle}>📜 Regole Generali</div>
        {generalRules.map(([title, desc]) => (
          <div key={title} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, minWidth: 180, color: "#00cfff" }}>{title}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      <div style={G.panel}>
        <div style={G.sectionTitle}>🏅 Punti per Piazzamento</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {pts.map(([rank, label, color]) => (
            <div key={rank} style={{ flex: 1, minWidth: 90, background: "rgba(255,255,255,0.04)", border: `1px solid ${color}33`, borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{rank}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color, lineHeight: 1 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: "12px 16px", background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 12, fontSize: 13, color: "#ffd700" }}>
          🏂 <strong>Dream Snowboard Cross:</strong> tutti i punti vengono raddoppiati (🥇 = 10pt, 🥈 = 6pt, 🥉 = 4pt, 4° = 2pt)
        </div>
      </div>

      <div style={G.panel}>
        <div style={G.sectionTitle}>⭐ Bonus Speciali</div>
        {BONUS_RULES.map(b => (
          <div key={b.id} style={{
            display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 10,
            padding: "14px 16px", borderRadius: 12,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              minWidth: 42, height: 42, borderRadius: 12,
              background: "rgba(0,207,255,0.15)", border: "1px solid rgba(0,207,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#00cfff",
            }}>+{b.pts}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{b.name}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 3 }}>{b.desc}</div>
              <div style={{ fontSize: 11, color: "#ffd700", fontWeight: 600, letterSpacing: 1 }}>🕐 {b.when}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={G.panel}>
        <div style={G.sectionTitle}>🗓️ Scaletta Serata</div>
        {schedule.map(([time, title, sub], i) => (
          <div key={time} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < schedule.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, color: "#00cfff", minWidth: 58 }}>{time}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
              {sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN LOCK ────────────────────────────────────────────────────────────────

function AdminLock({ onUnlock }: { onUnlock: () => void }) {
  const [pwd,      setPwd]      = useState("");
  const [shake,    setShake]    = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const attempt = () => {
    if (pwd === ADMIN_PASSWORD) {
      setUnlocked(true);
      setTimeout(onUnlock, 400);
    } else {
      setShake(true);
      setPwd("");
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div style={{
      ...G.panel, textAlign: "center", padding: "52px 32px",
      maxWidth: 380, margin: "40px auto", position: "relative", overflow: "hidden",
      animation:  shake ? "shake 0.5s ease" : unlocked ? "unlockPop 0.4s ease" : "none",
      border:     shake ? "1px solid rgba(255,68,102,0.5)" : unlocked ? "1px solid rgba(0,255,136,0.5)" : "1px solid rgba(0,210,255,0.18)",
      transition: "border 0.3s",
    }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: 20, pointerEvents: "none",
        background: unlocked
          ? "radial-gradient(ellipse at 50% 50%, rgba(0,255,136,0.08) 0%, transparent 70%)"
          : shake
          ? "radial-gradient(ellipse at 50% 50%, rgba(255,68,102,0.08) 0%, transparent 70%)"
          : "radial-gradient(ellipse at 50% 50%, rgba(0,207,255,0.05) 0%, transparent 70%)",
        transition: "background 0.3s",
      }} />
      <div style={{ fontSize: 48, marginBottom: 12 }}>{unlocked ? "🔓" : shake ? "❌" : "🔐"}</div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 3, color: "#00cfff", marginBottom: 6 }}>AREA RISERVATA</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>Solo il Mastro delle Cerimonie può entrare</div>
      <input
        ref={inputRef} type="password" value={pwd}
        onChange={e => setPwd(e.target.value)}
        onKeyDown={e => e.key === "Enter" && attempt()}
        placeholder="Password segreta…"
        style={{
          ...G.input, textAlign: "center", fontSize: 16, letterSpacing: 4, marginBottom: 14,
          border: shake ? "1px solid rgba(255,68,102,0.5)" : "1px solid rgba(0,210,255,0.2)",
          transition: "border 0.3s",
        }}
      />
      <button onClick={attempt} style={{ ...G.btn("#00cfff"), width: "100%", fontSize: 15, padding: "13px" }}>
        {unlocked ? "✓ Accesso concesso!" : "🔑 Entra"}
      </button>
      {/* <div style={{ marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.15)", letterSpacing: 1 }}>
        Password di default: <em>wii2026</em>
      </div> */}
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)}
          30%{transform:translateX(8px)}  45%{transform:translateX(-6px)}
          60%{transform:translateX(6px)}  75%{transform:translateX(-3px)} 90%{transform:translateX(3px)}
        }
        @keyframes unlockPop {
          0%{transform:scale(1)} 50%{transform:scale(1.03)} 100%{transform:scale(1)}
        }
      `}</style>
    </div>
  );
}

// ─── ADMIN TAB ─────────────────────────────────────────────────────────────────

function AdminTab({ state, setState }: PanelProps) {
  const [subTab, setSubTab] = useState("setup");
  const subTabs = [
    { id: "setup",   label: "👤 Setup Giocatori"   },
    { id: "results", label: "📊 Risultati & Bonus"  },
    { id: "danger",  label: "⚠️ Reset"              },
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "rgba(0,0,0,0.25)", padding: 5, borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
        {subTabs.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{
            flex: 1, padding: "9px 12px", border: "none", borderRadius: 10,
            background: subTab === t.id ? "rgba(255,255,255,0.1)" : "transparent",
            color:      subTab === t.id ? "#fff" : "rgba(255,255,255,0.4)",
            fontFamily: "inherit", fontWeight: 700, fontSize: 12, cursor: "pointer",
            transition: "all 0.2s", textTransform: "uppercase",
          }}>{t.label}</button>
        ))}
      </div>
      {subTab === "setup"   && <SetupPanel state={state} setState={setState} />}
      {subTab === "results" && (
        state.players.length === 0
          ? <div style={{ ...G.panel, textAlign: "center", padding: "40px", color: "#6ab0d4" }}>Prima aggiungi i giocatori nel tab Setup.</div>
          : <ResultsPanel state={state} setState={setState} />
      )}
      {subTab === "danger"  && (
        <div style={G.panel}>
          <div style={G.sectionTitle}>⚠️ Zona Pericolosa</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => setState(s => ({ ...s, results: {}, bonuses: {} }))} style={{ ...G.btn("#ff8c00") }}>🗑️ Reset solo risultati</button>
            <button onClick={() => { if (window.confirm("Sei sicuro? Cancella tutto!")) setState(() => INITIAL_STATE); }} style={{ ...G.btn("#ff2244") }}>💥 Reset completo</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APP ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [state, setStateRaw] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppState;
        if (!parsed.selectedEvents || parsed.selectedEvents.length === 0)
          parsed.selectedEvents = EVENTS.map(e => e.id);
        return parsed;
      }
    } catch { /* fresh start */ }
    return INITIAL_STATE;
  });

  const [tab,           setTab]           = useState("leaderboard");
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  const setState = (fn: (s: AppState) => AppState) => {
    setStateRaw(prev => {
      const next = fn(prev);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  };

  return (
    <div style={G.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Exo+2:wght@300;400;600;700;800;900&display=swap');
        @keyframes snowfall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 0.8; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0;   }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar       { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(0,207,255,0.3); border-radius: 3px; }
        input::placeholder        { color: rgba(255,255,255,0.25); }
        button:active             { transform: scale(0.96); }
      `}</style>

      <Snow />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 14px" }}>
        <Header tab={tab} onTabChange={setTab} />
        <div style={{ marginTop: 24 }}>
          {tab === "leaderboard" && <Leaderboard state={state} />}
          {tab === "events"      && <EventsTable state={state} />}
          {tab === "rules"       && <Rules />}
          {tab === "admin"       && (
            adminUnlocked
              ? <AdminTab state={state} setState={setState} />
              : <AdminLock onUnlock={() => setAdminUnlocked(true)} />
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: 1 }}>
          💾 Dati salvati automaticamente nel browser · Sviluppato con ❄️ per la serata olimpica
        </div>
      </div>
    </div>
  );
}