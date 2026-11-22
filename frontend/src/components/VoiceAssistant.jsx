import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, Send, Shield, ShieldX,
  ShieldCheck, ShieldAlert, AlertTriangle, X, Minimize2,
  Loader2, Bot, ChevronDown, Zap
} from 'lucide-react';

/* ─── API ────────────────────────────────────────────────────────────────── */
const API_BASE = window.location.port === '5173' ? 'http://127.0.0.1:8000/api' : '/api';

async function queryVA(message) {
  const res = await fetch(`${API_BASE}/voice-assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Service unavailable');
  return res.json();
}

/* ─── Alert colours ──────────────────────────────────────────────────────── */
const A = {
  CRITICAL: { color: '#ff4466', bg: 'rgba(255,68,102,0.10)', border: 'rgba(255,68,102,0.35)', Icon: ShieldX,    label: 'CRITICAL' },
  WARNING:  { color: '#ffaa00', bg: 'rgba(255,170,0,0.08)',  border: 'rgba(255,170,0,0.3)',   Icon: ShieldAlert, label: 'WARNING'  },
  INFO:     { color: '#00d4ff', bg: 'rgba(0,212,255,0.06)',  border: 'rgba(0,212,255,0.2)',   Icon: ShieldCheck, label: 'SECURE'   },
};

/* ─── Quick suggestions ──────────────────────────────────────────────────── */
const QUICK = [
  { label: '🔍 Scan threats',    q: 'scan for malicious processes' },
  { label: '📊 System status',   q: 'show system status' },
  { label: '🔥 Top processes',   q: 'show top processes' },
  { label: '🛡️ Security tips',  q: 'give me security advice' },
];

/* ─── Mic wave animation ─────────────────────────────────────────────────── */
function Wave({ on }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:2, height:14 }}>
      {[0.5,1,0.7,1,0.5].map((h,i) => (
        <span key={i} style={{
          display:'block', width:2.5, borderRadius:2,
          background: on ? '#ff4466' : '#4a6a8a',
          height: `${h * (on ? 14 : 6)}px`,
          animation: on ? `kWave .6s ${i*.1}s ease-in-out infinite alternate` : 'none',
          transition:'height .15s',
        }}/>
      ))}
      <style>{`@keyframes kWave{from{transform:scaleY(.4)}to{transform:scaleY(1.3)}}`}</style>
    </span>
  );
}

/* ─── Single message bubble ──────────────────────────────────────────────── */
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  const cfg = A[msg.alertLevel] || A.INFO;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap:4 }}>
      {/* label row */}
      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, color:'#2d4a66', letterSpacing:'.07em', fontWeight:700 }}>
        {!isUser && <Bot style={{width:9,height:9}}/>}
        <span style={{textTransform:'uppercase'}}>{isUser ? 'You' : 'KAIROS Guard'}</span>
        {!isUser && msg.alertLevel && (
          <span style={{
            background: cfg.bg, color: cfg.color, border:`1px solid ${cfg.border}`,
            borderRadius:3, padding:'0 5px', fontSize:8, fontWeight:800, letterSpacing:'.1em',
          }}>{cfg.label}</span>
        )}
      </div>

      {/* bubble */}
      <div style={{
        maxWidth:'92%',
        background: isUser ? 'rgba(0,212,255,0.08)' : (msg.alertLevel==='CRITICAL' ? cfg.bg : '#0a1422'),
        border:`1px solid ${isUser ? 'rgba(0,212,255,0.22)' : (msg.alertLevel!=='INFO' ? cfg.border : '#132035')}`,
        borderRadius: isUser ? '10px 10px 2px 10px' : '2px 10px 10px 10px',
        padding:'8px 11px', fontSize:11.5, lineHeight:1.6,
        color: isUser ? '#a8d4f0' : '#c0d8ec', wordBreak:'break-word',
        boxShadow: !isUser && msg.alertLevel==='CRITICAL' ? `0 0 18px ${cfg.border}` : 'none',
      }}>{msg.text}</div>

      {/* threat pills */}
      {!isUser && (msg.threats||[]).map((t,i)=>(
        <div key={i} style={{
          maxWidth:'92%', background:'rgba(255,68,102,0.07)',
          border:'1px solid rgba(255,68,102,0.3)', borderRadius:6, padding:'6px 10px',
        }}>
          <div style={{display:'flex',gap:5,alignItems:'center',marginBottom:3}}>
            <ShieldX style={{width:10,height:10,color:'#ff4466',flexShrink:0}}/>
            <span style={{color:'#ff4466',fontSize:9,fontWeight:800,letterSpacing:'.08em'}}>{t.severity} · {t.type}</span>
          </div>
          <div style={{fontSize:10.5,color:'#c0d8ec'}}>
            <b style={{color:'#ff7788'}}>{t.name}</b> PID:{t.pid} · CPU:{t.cpu}% · {t.memory_mb}MB
          </div>
          <div style={{fontSize:9.5,color:'#ffaa6a',marginTop:3}}>→ {t.advice}</div>
        </div>
      ))}

      {/* suspicious pills */}
      {!isUser && (msg.suspicious||[]).slice(0,2).map((s,i)=>(
        <div key={i} style={{
          maxWidth:'92%', background:'rgba(255,170,0,0.06)',
          border:'1px solid rgba(255,170,0,0.25)', borderRadius:6, padding:'6px 10px',
        }}>
          <div style={{display:'flex',gap:5,alignItems:'center',marginBottom:3}}>
            <AlertTriangle style={{width:10,height:10,color:'#ffaa00',flexShrink:0}}/>
            <span style={{color:'#ffaa00',fontSize:9,fontWeight:800}}>SUSPICIOUS</span>
          </div>
          <div style={{fontSize:10.5,color:'#c0d8ec'}}>
            <b style={{color:'#ffcc44'}}>{s.name}</b> PID:{s.pid} · CPU:{s.cpu}%
          </div>
        </div>
      ))}

      {/* tips row */}
      {!isUser && (msg.quickTips||[]).length>0 && (
        <div style={{maxWidth:'92%',display:'flex',flexWrap:'wrap',gap:3}}>
          {msg.quickTips.slice(0,2).map((t,i)=>(
            <span key={i} style={{
              background:'rgba(0,212,255,0.04)',border:'1px solid rgba(0,212,255,0.12)',
              borderRadius:4,padding:'2px 6px',fontSize:9,color:'#3d6080',
            }}>💡 {t}</span>
          ))}
        </div>
      )}

      <span style={{fontSize:8,color:'#1a2e44'}}>{msg.time}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main floating widget
═══════════════════════════════════════════════════════════════════════════ */
export default function VoiceAssistantWidget() {
  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [listening, setListening]     = useState(false);
  const [speaking, setSpeaking]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [ttsOn, setTtsOn]             = useState(true);
  const [srOk, setSrOk]               = useState(false);
  const [ttsOk, setTtsOk]             = useState(false);
  const [liveText, setLiveText]       = useState('');
  const [pulse, setPulse]             = useState(false);   // fab pulse when closed
  const [unread, setUnread]           = useState(0);

  const endRef      = useRef(null);
  const recogRef    = useRef(null);
  const synthRef    = useRef(null);
  const inputRef    = useRef(null);
  const voicesRef   = useRef([]);            // cached voice list
  const pendingRef  = useRef(null);          // queued text to speak after user interaction
  const userActed   = useRef(false);         // tracks if user has interacted

  /* detect capabilities + load voices */
  useEffect(()=>{
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setSrOk(true);
    if ('speechSynthesis' in window){
      setTtsOk(true);
      synthRef.current = window.speechSynthesis;
      // Chrome loads voices async — listen for the event
      const loadVoices = () => {
        voicesRef.current = synthRef.current.getVoices();
      };
      loadVoices();
      synthRef.current.addEventListener('voiceschanged', loadVoices);
      return () => synthRef.current?.removeEventListener('voiceschanged', loadVoices);
    }
  },[]);

  /* auto scroll */
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[messages,loading]);

  /* focus input when opened — also unlock TTS on first open (counts as user gesture) */
  useEffect(()=>{
    if (open) {
      setUnread(0);
      inputRef.current?.focus();
      userActed.current = true;
      // If there is a pending greeting to speak, play it now
      if (pendingRef.current) {
        doSpeak(pendingRef.current);
        pendingRef.current = null;
      }
    }
  },[open]); // eslint-disable-line

  /* Core TTS speaker — picks best voice, handles Chrome quirks */
  const doSpeak = useCallback((text)=>{
    if (!ttsOk || !synthRef.current) return;
    synthRef.current.cancel();
    // Clean emoji/symbols for cleaner speech
    const clean = text.replace(/[⚠️✅⚡🔍📊🔥🛡️🌐❓💡→·•—–]/gu, ' ').replace(/\s+/g,' ').trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.rate   = 0.95;
    u.pitch  = 1.05;
    u.volume = 1.0;
    u.onstart = () => setSpeaking(true);
    u.onend   = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    // Pick the best English voice
    const voices = voicesRef.current.length ? voicesRef.current : (synthRef.current.getVoices() || []);
    const best =
      voices.find(v => v.name.includes('Google US English'))  ||
      voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
      voices.find(v => v.lang === 'en-US') ||
      voices.find(v => v.lang.startsWith('en')) ||
      null;
    if (best) u.voice = best;
    u.lang = 'en-US';
    synthRef.current.speak(u);

    // Chrome bug: synthesis pauses after ~15s. Keep it alive.
    const keepAlive = setInterval(() => {
      if (!synthRef.current?.speaking) { clearInterval(keepAlive); return; }
      synthRef.current.pause();
      synthRef.current.resume();
    }, 10000);
    u.onend = () => { clearInterval(keepAlive); setSpeaking(false); };
    u.onerror = () => { clearInterval(keepAlive); setSpeaking(false); };
  },[ttsOk]);

  /* Public speak wrapper — respects ttsOn toggle + user interaction requirement */
  const speak = useCallback((text)=>{
    if (!ttsOn) return;
    if (!userActed.current) {
      // Queue it — will play when user first opens the widget
      pendingRef.current = text;
      return;
    }
    doSpeak(text);
  },[ttsOn, doSpeak]);

  const stopSpeak = ()=>{ synthRef.current?.cancel(); setSpeaking(false); pendingRef.current = null; };

  /* push assistant reply */
  const pushAssistant = useCallback((data)=>{
    const now = new Date().toLocaleTimeString('en-US',{hour12:false});
    const msg = {
      role:'assistant', text:data.response,
      alertLevel:data.alert_level||'INFO',
      threats:data.threats||[], suspicious:data.suspicious||[],
      quickTips:data.quick_tips||[], time:now, id:Date.now(),
    };
    setMessages(p=>[...p,msg]);
    if (!open){ setUnread(u=>u+1); setPulse(true); setTimeout(()=>setPulse(false),1200); }
    speak(data.response);
  },[open,speak]);

  /* send */
  const send = useCallback(async(text)=>{
    const t = text.trim();
    if (!t || loading) return;
    const now = new Date().toLocaleTimeString('en-US',{hour12:false});
    setMessages(p=>[...p,{role:'user',text:t,time:now,id:Date.now()}]);
    setInput(''); setLiveText(''); setLoading(true);
    try { pushAssistant(await queryVA(t)); }
    catch(e){ pushAssistant({response:`⚠️ ${e.message}`,alert_level:'WARNING',threats:[],suspicious:[],quick_tips:[]}); }
    finally { setLoading(false); }
  },[loading,pushAssistant]);

  /* boot greeting once */
  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try{ pushAssistant(await queryVA('hello')); }
      catch{ pushAssistant({response:"⚠️ Backend offline — start the KAIROS server on port 8000.",alert_level:'WARNING',threats:[],suspicious:[],quick_tips:[]}); }
      finally{ setLoading(false); }
    })();
  },[]); // eslint-disable-line

  /* speech recognition */
  const startListen = useCallback(()=>{
    if (!srOk||listening) return;
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous=false; r.interimResults=true; r.lang='en-US';
    r.onstart=()=>setListening(true);
    r.onend=()=>{setListening(false);setLiveText('');};
    r.onerror=()=>{setListening(false);setLiveText('');};
    r.onresult=(e)=>{
      let interim='',final='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        const t=e.results[i][0].transcript;
        if(e.results[i].isFinal) final+=t; else interim+=t;
      }
      setLiveText(interim||final);
      if(final){setListening(false);send(final);}
    };
    recogRef.current=r; r.start(); stopSpeak();
  },[srOk,listening,send]);

  const stopListen=()=>{recogRef.current?.stop();setListening(false);};

  /* alert level of last assistant msg */
  const lastAlert = [...messages].reverse().find(m=>m.role==='assistant')?.alertLevel||'INFO';
  const fabCfg    = lastAlert==='CRITICAL' ? {c:'#ff4466',glow:'rgba(255,68,102,0.5)'} :
                    lastAlert==='WARNING'  ? {c:'#ffaa00',glow:'rgba(255,170,0,0.4)'}  :
                                             {c:'#00d4ff',glow:'rgba(0,212,255,0.4)'};

  /* ── RENDER ─────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ══ Floating Action Button ══════════════════════════════════════════ */}
      {!open && (
        <button
          onClick={()=>setOpen(true)}
          title="Open Security Guard"
          style={{
            position:'fixed', bottom:24, right:24, zIndex:9999,
            width:56, height:56, borderRadius:'50%', border:'none', cursor:'pointer',
            background:`linear-gradient(135deg, ${fabCfg.c}22, ${fabCfg.c}44)`,
            backdropFilter:'blur(12px)',
            boxShadow:`0 0 ${pulse?28:18}px ${fabCfg.glow}, 0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`,
            border:`1.5px solid ${fabCfg.c}66`,
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'box-shadow .3s, transform .2s',
            transform: pulse ? 'scale(1.12)' : 'scale(1)',
          }}
          onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'}
          onMouseLeave={e=>e.currentTarget.style.transform=pulse?'scale(1.12)':'scale(1)'}
        >
          <Shield style={{width:24,height:24,color:fabCfg.c}}/>
          {/* ping ring */}
          <span style={{
            position:'absolute', inset:-4, borderRadius:'50%',
            border:`1.5px solid ${fabCfg.c}44`,
            animation:'fabPing 2s ease-in-out infinite',
          }}/>
          {/* unread badge */}
          {unread>0 && (
            <span style={{
              position:'absolute', top:0, right:0,
              background:'#ff4466', color:'#fff', borderRadius:'50%',
              width:18, height:18, fontSize:9, fontWeight:800,
              display:'flex', alignItems:'center', justifyContent:'center',
              border:'2px solid #05080f',
            }}>{unread}</span>
          )}
          <style>{`
            @keyframes fabPing { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.3);opacity:0} }
          `}</style>
        </button>
      )}

      {/* ══ Chat Panel ══════════════════════════════════════════════════════ */}
      {open && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:9999,
          width:360, height:540,
          display:'flex', flexDirection:'column',
          background:'#060d1a',
          border:'1px solid #132035',
          borderRadius:16,
          boxShadow:'0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.06)',
          fontFamily:"'JetBrains Mono',ui-monospace,monospace",
          overflow:'hidden',
          animation:'slideUp .22s cubic-bezier(.16,1,.3,1)',
        }}>
          <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* ── Header ── */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'11px 14px',
            background:'linear-gradient(135deg,#07101e,#0b1628)',
            borderBottom:'1px solid #132035',
            flexShrink:0,
          }}>
            <div style={{display:'flex',alignItems:'center',gap:9}}>
              {/* shield icon with status ring */}
              <div style={{position:'relative',flexShrink:0}}>
                <div style={{
                  width:34, height:34, borderRadius:'50%',
                  background:`linear-gradient(135deg,${fabCfg.c}22,${fabCfg.c}44)`,
                  border:`1.5px solid ${fabCfg.c}66`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:`0 0 12px ${fabCfg.glow}`,
                }}>
                  <Shield style={{width:16,height:16,color:fabCfg.c}}/>
                </div>
                {/* live dot */}
                <span style={{
                  position:'absolute',bottom:1,right:1,
                  width:8,height:8,borderRadius:'50%',
                  background:lastAlert==='CRITICAL'?'#ff4466':lastAlert==='WARNING'?'#ffaa00':'#00ff88',
                  border:'1.5px solid #060d1a',
                  boxShadow:`0 0 6px ${lastAlert==='CRITICAL'?'#ff4466':lastAlert==='WARNING'?'#ffaa00':'#00ff88'}`,
                }}/>
              </div>
              <div>
                <div style={{color:'#e2eaf5',fontSize:12,fontWeight:800,letterSpacing:'.07em'}}>
                  KAIROS Guard
                </div>
                <div style={{display:'flex',alignItems:'center',gap:4,fontSize:9,color:'#3d6080',letterSpacing:'.05em'}}>
                  <span style={{
                    width:5,height:5,borderRadius:'50%',background:'#00ff88',display:'inline-block',
                    animation:'dot 1.5s ease-in-out infinite alternate',
                  }}/>
                  <style>{`@keyframes dot{from{opacity:.4}to{opacity:1}}`}</style>
                  Security AI · Voice Enabled
                </div>
              </div>
            </div>

            {/* header actions */}
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              {ttsOk && (
                <button onClick={()=>{setTtsOn(e=>!e);stopSpeak();}}
                  title={ttsOn?'Mute':'Unmute'}
                  style={{
                    background:ttsOn?'rgba(0,255,136,0.08)':'rgba(60,70,90,0.08)',
                    border:`1px solid ${ttsOn?'rgba(0,255,136,0.25)':'rgba(60,70,90,0.2)'}`,
                    color:ttsOn?'#00ff88':'#3d5a78',
                    borderRadius:7, padding:'4px 7px', cursor:'pointer',
                    display:'flex', alignItems:'center', gap:3, fontSize:9, fontWeight:700,
                  }}>
                  {speaking
                    ? <VolumeX style={{width:11,height:11}}/>
                    : <Volume2 style={{width:11,height:11}}/>}
                  {ttsOn?'ON':'OFF'}
                </button>
              )}
              <button onClick={()=>setOpen(false)} title="Minimize"
                style={{
                  background:'rgba(255,255,255,0.03)', border:'1px solid #132035',
                  color:'#3d5a78', borderRadius:7, padding:'4px 7px',
                  cursor:'pointer', display:'flex', alignItems:'center',
                }}>
                <ChevronDown style={{width:13,height:13}}/>
              </button>
            </div>
          </div>

          {/* ── Quick action chips ── */}
          <div style={{
            display:'flex', gap:5, padding:'7px 10px',
            borderBottom:'1px solid #0d1e30', flexShrink:0,
            overflowX:'auto', scrollbarWidth:'none',
          }}>
            {QUICK.map((q,i)=>(
              <button key={i} onClick={()=>send(q.q)} disabled={loading}
                style={{
                  flexShrink:0, background:'#080e1c', border:'1px solid #132035',
                  borderRadius:20, padding:'3px 9px', cursor:loading?'not-allowed':'pointer',
                  color:'#4a7a9b', fontSize:9.5, fontWeight:600, fontFamily:'inherit',
                  whiteSpace:'nowrap', opacity:loading?.6:1, transition:'all .15s',
                }}
                onMouseEnter={e=>{if(!loading){e.target.style.borderColor='#00d4ff';e.target.style.color='#00d4ff';}}}
                onMouseLeave={e=>{e.target.style.borderColor='#132035';e.target.style.color='#4a7a9b';}}>
                {q.label}
              </button>
            ))}
          </div>

          {/* ── Messages ── */}
          <div style={{
            flex:1, overflowY:'auto', padding:'12px 12px 4px',
            display:'flex', flexDirection:'column', gap:14,
            scrollbarWidth:'thin', scrollbarColor:'#1d3352 transparent',
          }}>
            {messages.map(m=><Bubble key={m.id} msg={m}/>)}

            {loading && (
              <div style={{display:'flex',alignItems:'center',gap:7,
                background:'#0a1422',border:'1px solid #132035',
                borderRadius:'2px 10px 10px 10px',padding:'8px 12px',
                alignSelf:'flex-start'}}>
                <Loader2 style={{width:12,height:12,color:'#00d4ff',animation:'spin 1s linear infinite'}}/>
                <span style={{color:'#3d6080',fontSize:11}}>Scanning processes…</span>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {/* live transcript bubble */}
            {listening && liveText && (
              <div style={{
                alignSelf:'flex-end', background:'rgba(0,212,255,0.06)',
                border:'1px dashed rgba(0,212,255,0.25)', borderRadius:'10px 10px 2px 10px',
                padding:'7px 10px', fontSize:11, color:'#6a9ab8', maxWidth:'85%', fontStyle:'italic',
              }}>"{liveText}…"</div>
            )}

            <div ref={endRef}/>
          </div>

          {/* ── Listening banner ── */}
          {listening && (
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'6px', flexShrink:0,
              background:'rgba(255,68,102,0.07)', borderTop:'1px solid rgba(255,68,102,0.2)',
            }}>
              <Wave on/>
              <span style={{color:'#ff4466',fontSize:10,fontWeight:700,letterSpacing:'.08em'}}>
                LISTENING — Speak your command…
              </span>
              <Wave on/>
            </div>
          )}

          {/* ── Speaking banner ── */}
          {speaking && !listening && (
            <div style={{
              display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              padding:'5px',flexShrink:0,
              background:'rgba(0,255,136,0.05)',borderTop:'1px solid rgba(0,255,136,0.15)',
            }}>
              <Zap style={{width:10,height:10,color:'#00ff88'}}/>
              <span style={{color:'#00ff88',fontSize:9,fontWeight:700,letterSpacing:'.08em'}}>SPEAKING…</span>
            </div>
          )}

          {/* ── Input row ── */}
          <div style={{
            display:'flex', gap:6, padding:'10px 10px 12px',
            borderTop:'1px solid #0d1e30', flexShrink:0,
            background:'#060d1a',
          }}>
            {/* mic */}
            {srOk && (
              <button onClick={listening?stopListen:startListening}
                disabled={loading}
                title={listening?'Stop':'Speak'}
                style={{
                  width:36, height:36, borderRadius:10, flexShrink:0,
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1,
                  background:listening?'rgba(255,68,102,0.15)':'rgba(0,212,255,0.06)',
                  border:`1px solid ${listening?'rgba(255,68,102,0.5)':'rgba(0,212,255,0.18)'}`,
                  color:listening?'#ff4466':'#4a6a8a',
                  cursor:loading?'not-allowed':'pointer',
                  boxShadow:listening?'0 0 14px rgba(255,68,102,0.35)':'none',
                  transition:'all .2s',
                }}>
                {listening ? <Wave on/> : <Mic style={{width:14,height:14}}/>}
              </button>
            )}

            {/* text field */}
            <input ref={inputRef}
              type="text" value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(input);}}}
              placeholder={listening?'🎙️ Listening…':'Ask about system security…'}
              disabled={loading||listening}
              style={{
                flex:1, background:'#080e1c', border:'1px solid #132035',
                borderRadius:10, padding:'8px 11px', color:'#c0d8ec',
                fontSize:11.5, fontFamily:'inherit', outline:'none',
                transition:'border-color .2s',
              }}
              onFocus={e=>e.target.style.borderColor='#00d4ff'}
              onBlur={e=>e.target.style.borderColor='#132035'}
            />

            {/* send */}
            <button onClick={()=>send(input)}
              disabled={loading||!input.trim()}
              title="Send"
              style={{
                width:36, height:36, borderRadius:10, flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                background:(loading||!input.trim())?'rgba(0,212,255,0.03)':'rgba(0,212,255,0.12)',
                border:`1px solid ${(loading||!input.trim())?'#132035':'rgba(0,212,255,0.3)'}`,
                color:(loading||!input.trim())?'#1d3352':'#00d4ff',
                cursor:(loading||!input.trim())?'not-allowed':'pointer',
                transition:'all .2s',
              }}>
              <Send style={{width:14,height:14}}/>
            </button>
          </div>
        </div>
      )}
    </>
  );

  /* helper fwd-ref for startListening inside send closure */
  function startListening(){ startListen(); }
}
