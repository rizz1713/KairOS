"""
KAIROS Voice Assistant – Security & Process Guard
Analyzes running processes, detects suspicious/malicious activity,
and returns natural-language security advice.
"""

import re
import psutil
from typing import Dict, Any, List
from app.telemetry import get_system_metrics, get_process_list

# ─────────────────────────────────────────────────────────────────────────────
# Known-malicious / suspicious process patterns
# ─────────────────────────────────────────────────────────────────────────────
MALICIOUS_SIGNATURES: List[Dict[str, Any]] = [
    # Ransomware / crypto miners
    {"pattern": r"xmrig|minerd|cpuminer|cgminer|bfgminer|nicehash",
     "severity": "CRITICAL", "type": "Crypto Miner",
     "advice": "Immediately kill this process — it is a cryptocurrency miner consuming your CPU resources illegally."},
    {"pattern": r"wannacry|petya|notpetya|locky|cerber|cryptolocker|ryuk|sodinokibi|revil",
     "severity": "CRITICAL", "type": "Ransomware",
     "advice": "RANSOMWARE DETECTED! Disconnect from the network immediately, back up data, and run a full antivirus scan."},
    # Remote Access Trojans / backdoors
    {"pattern": r"njrat|darkcomet|nanocore|quasar|asyncrat|remcos|gh0st|poison_ivy|blackshades",
     "severity": "CRITICAL", "type": "Remote Access Trojan (RAT)",
     "advice": "A RAT is active on your system — terminate it immediately and audit your network connections."},
    # Network attack tools
    {"pattern": r"nmap|masscan|zmap|netcat|nc\.exe|socat|hping|ettercap|arpspoof",
     "severity": "HIGH", "type": "Network Scanner / Attack Tool",
     "advice": "A network scanning tool is running. If not authorized, terminate it and investigate who launched it."},
    # Credential stealers
    {"pattern": r"mimikatz|lsass_dump|pwdump|fgdump|gsecdump|wce\.exe|quarks",
     "severity": "CRITICAL", "type": "Credential Harvester",
     "advice": "CREDENTIAL THEFT TOOL detected! Change all passwords immediately and terminate this process."},
    # Keyloggers
    {"pattern": r"keylogger|klogger|revealer|ardamax|spyrix|refog",
     "severity": "HIGH", "type": "Keylogger",
     "advice": "A keylogger may be recording your keystrokes. Terminate this process and run a malware scan."},
    # Port scanners / exploit frameworks
    {"pattern": r"metasploit|msfconsole|msfvenom|beef-xss|sqlmap|burpsuite",
     "severity": "HIGH", "type": "Exploit Framework",
     "advice": "An exploitation framework is running. Unless authorized for security testing, terminate it now."},
    # Suspicious PowerShell / scripting
    {"pattern": r"powershell.*-enc|-nop|-w hidden|-exec bypass|iex\(|invoke-expression",
     "severity": "HIGH", "type": "Obfuscated PowerShell",
     "advice": "Obfuscated PowerShell execution detected — a common malware technique. Inspect and terminate if unauthorized."},
    # Suspicious cmd patterns
    {"pattern": r"cmd.*\/c.*del|regsvr32.*\/s.*\/u|rundll32.*javascript|wscript.*\.vbs",
     "severity": "MEDIUM", "type": "Suspicious Script Execution",
     "advice": "Suspicious command-line script detected. Verify its source before allowing it to continue."},
    # Spyware / adware
    {"pattern": r"spyware|adware|gator|cydoor|bonzi|180search|aurora|zango",
     "severity": "MEDIUM", "type": "Spyware / Adware",
     "advice": "Spyware or adware process detected. Terminate and run a full system scan."},
    # Rootkits (common names)
    {"pattern": r"rustock|tdss|tdl|zeroaccess|sinowal|mebroot|rootkit",
     "severity": "CRITICAL", "type": "Rootkit",
     "advice": "A rootkit signature was found! Boot from a clean OS and perform offline malware removal."},
    # Suspicious high-CPU unnamed processes
]

# Legitimate high-CPU processes (whitelist patterns)
SAFE_PROCESS_WHITELIST = {
    "system", "registry", "smss.exe", "csrss.exe", "wininit.exe", "services.exe",
    "lsass.exe", "svchost.exe", "dwm.exe", "explorer.exe", "taskmgr.exe",
    "chrome.exe", "firefox.exe", "msedge.exe", "code.exe", "python.exe",
    "node.exe", "java.exe", "javaw.exe", "outlook.exe", "teams.exe",
    "steam.exe", "discord.exe", "slack.exe", "zoom.exe", "skype.exe",
    "winlogon.exe", "spoolsv.exe", "msiexec.exe", "conhost.exe",
    "audiodg.exe", "fontdrvhost.exe", "sihost.exe", "taskhostw.exe",
    "runtimebroker.exe", "searchhost.exe", "startmenuexperiencehost.exe",
    "shellexperiencehost.exe", "ctfmon.exe", "dllhost.exe"
}

# ─────────────────────────────────────────────────────────────────────────────
# Intent detection for the chat
# ─────────────────────────────────────────────────────────────────────────────
INTENT_PATTERNS = {
    "scan_processes":   r"scan|check|detect|malicious|threat|virus|malware|suspicious|attack|hack",
    "system_status":    r"system status|how is|performance|cpu|memory|ram|disk|overview",
    "top_processes":    r"top process|highest cpu|most memory|resource hog|which process",
    "kill_process":     r"kill|terminate|stop|end process|close process",
    "help":             r"help|what can you do|commands|guide|how to use",
    "advice":           r"advice|recommend|suggest|protect|secure|prevent|safe",
    "network":          r"network|connection|firewall|port|traffic|bandwidth",
    "greeting":         r"hello|hi|hey|good morning|good evening|greet",
}


def detect_intent(text: str) -> str:
    text_lower = text.lower()
    for intent, pattern in INTENT_PATTERNS.items():
        if re.search(pattern, text_lower):
            return intent
    return "general"


def scan_for_malicious_processes() -> Dict[str, Any]:
    """Scan running processes against known malicious signatures."""
    threats = []
    suspicious = []
    all_procs = get_process_list(limit=250, sort_by="cpu_percent", order="desc")

    for proc in all_procs:
        name_lower = (proc.get("name") or "").lower()
        matched = False

        for sig in MALICIOUS_SIGNATURES:
            if re.search(sig["pattern"], name_lower, re.IGNORECASE):
                threats.append({
                    "pid": proc["pid"],
                    "name": proc["name"],
                    "severity": sig["severity"],
                    "type": sig["type"],
                    "advice": sig["advice"],
                    "cpu": proc["cpu_percent"],
                    "memory_mb": proc["memory_mb"],
                })
                matched = True
                break

        # Flag unknown high-CPU processes
        if not matched and proc["cpu_percent"] > 70:
            is_known = any(proc.get("name", "").lower() == w for w in SAFE_PROCESS_WHITELIST)
            if not is_known:
                suspicious.append({
                    "pid": proc["pid"],
                    "name": proc["name"],
                    "cpu": proc["cpu_percent"],
                    "memory_mb": proc["memory_mb"],
                    "advice": f"Process '{proc['name']}' is consuming {proc['cpu_percent']}% CPU. Verify it is legitimate."
                })

    return {
        "threats": threats,
        "suspicious": suspicious,
        "total_scanned": len(all_procs),
        "safe": len(threats) == 0 and len(suspicious) == 0
    }


def build_response(user_message: str) -> Dict[str, Any]:
    """
    Main chatbot logic: processes user query, runs system checks,
    returns a structured response with text + alert metadata.
    """
    intent = detect_intent(user_message)
    metrics = get_system_metrics()
    cpu_pct = metrics["cpu"]["percent"]
    mem_pct = metrics["memory"]["percent"]
    proc_count = metrics["process_count"]

    alert_level = "INFO"   # INFO | WARNING | CRITICAL
    response_text = ""
    threats_found = []
    suspicious_found = []
    quick_tips = []

    # ── GREETING ──────────────────────────────────────────────────────────
    if intent == "greeting":
        response_text = (
            "Hello! I'm KAIROS Security Guard — your AI voice assistant for system protection. "
            f"Your system currently has {proc_count} running processes, "
            f"CPU at {cpu_pct}% and Memory at {mem_pct}%. "
            "I can scan for malicious processes, give you security advice, "
            "and monitor your system in real time. How can I help you?"
        )
        quick_tips = [
            "Say 'scan for threats' to check for malicious processes",
            "Say 'system status' for a full health report",
            "Say 'top processes' to see resource hogs",
            "Say 'give me security advice' for protection tips",
        ]

    # ── SCAN FOR THREATS ──────────────────────────────────────────────────
    elif intent == "scan_processes":
        scan = scan_for_malicious_processes()
        threats_found = scan["threats"]
        suspicious_found = scan["suspicious"]

        if threats_found:
            alert_level = "CRITICAL"
            names = ", ".join(f"{t['name']} (PID:{t['pid']})" for t in threats_found)
            response_text = (
                f"⚠️ SECURITY ALERT! I found {len(threats_found)} MALICIOUS process(es): {names}. "
                f"These are classified as: {', '.join(set(t['type'] for t in threats_found))}. "
                "I strongly recommend you terminate these processes immediately using the Process Table. "
                f"Additionally, {len(suspicious_found)} suspicious high-CPU process(es) need your attention."
            )
        elif suspicious_found:
            alert_level = "WARNING"
            names = ", ".join(f"{s['name']} ({s['cpu']}% CPU)" for s in suspicious_found[:3])
            response_text = (
                f"⚡ No known malware detected, but I found {len(suspicious_found)} suspicious process(es) "
                f"with unusually high CPU usage: {names}. "
                "Please verify these are legitimate applications. "
                f"Total {scan['total_scanned']} processes were scanned."
            )
        else:
            alert_level = "INFO"
            response_text = (
                f"✅ System scan complete. All {scan['total_scanned']} processes appear clean. "
                "No known malware signatures detected. "
                "Your system is currently safe. "
                "I'll continue monitoring in the background."
            )

        quick_tips = [
            "Go to OS Algorithms tab to manage processes",
            "High CPU unknown processes are always suspicious",
            "Keep Windows Defender / antivirus up to date",
            "Never run .exe files from unknown sources",
        ]

    # ── SYSTEM STATUS ─────────────────────────────────────────────────────
    elif intent == "system_status":
        disk_pct = metrics["disk"]["percent"]
        net_recv = metrics["network"]["recv_kb_s"]
        net_sent = metrics["network"]["sent_kb_s"]

        if cpu_pct > 90 or mem_pct > 90:
            alert_level = "WARNING"
            response_text = (
                f"⚠️ System under HEAVY LOAD. CPU: {cpu_pct}%, Memory: {mem_pct}%, "
                f"Disk: {disk_pct}%, Active Processes: {proc_count}. "
                f"Network I/O — Receiving: {net_recv} KB/s, Sending: {net_sent} KB/s. "
                "High resource usage can indicate a crypto miner or malware. "
                "Consider running a threat scan."
            )
        else:
            response_text = (
                f"System is operating normally. CPU: {cpu_pct}%, Memory: {mem_pct}%, "
                f"Disk: {disk_pct}%, Active Processes: {proc_count}. "
                f"Network I/O — Receiving: {net_recv} KB/s, Sending: {net_sent} KB/s. "
                "All metrics are within safe thresholds."
            )
        quick_tips = [
            "CPU > 90% sustained may indicate malware activity",
            "Unexpected network spikes can signal data exfiltration",
            "Use ML Advisor to optimize scheduling",
        ]

    # ── TOP PROCESSES ─────────────────────────────────────────────────────
    elif intent == "top_processes":
        top_procs = get_process_list(limit=5, sort_by="cpu_percent", order="desc")
        lines = []
        for p in top_procs:
            is_safe = any(p.get("name", "").lower() == w for w in SAFE_PROCESS_WHITELIST)
            flag = "" if is_safe else " ⚠️ UNKNOWN"
            lines.append(f"{p['name']} (PID:{p['pid']}) — CPU:{p['cpu_percent']}%, MEM:{p['memory_mb']}MB{flag}")

        response_text = (
            f"Top 5 resource-consuming processes right now: "
            + " | ".join(lines) +
            ". Processes marked with ⚠️ are not in the known-safe list — please verify them."
        )
        alert_level = "WARNING" if any("⚠️" in l for l in lines) else "INFO"
        quick_tips = [
            "Use Process Table to terminate suspicious processes",
            "REALTIME priority processes can starve other apps",
            "Check if unknown processes have valid digital signatures",
        ]

    # ── KILL PROCESS ──────────────────────────────────────────────────────
    elif intent == "kill_process":
        response_text = (
            "To terminate a process safely: navigate to the 'OS Algorithms' tab, "
            "find the process in the Process Table, and click 'Terminate' or 'Force Kill'. "
            "For malicious processes flagged in my scan, use 'Force Kill' immediately. "
            "⚠️ Never run unknown .exe files, never open email attachments from strangers, "
            "and always verify software before installation."
        )
        quick_tips = [
            "Terminate sends SIGTERM (graceful shutdown)",
            "Force Kill sends SIGKILL (immediate termination)",
            "Always scan downloads with antivirus before running",
            "Use Task Manager as backup if the app is unavailable",
        ]

    # ── SECURITY ADVICE ───────────────────────────────────────────────────
    elif intent == "advice":
        response_text = (
            "Here are my top security recommendations to protect your system: "
            "1. Never open executable files from unknown sources or email attachments. "
            "2. Keep your operating system and antivirus updated at all times. "
            "3. Use strong unique passwords and enable two-factor authentication. "
            "4. Monitor network traffic for unexpected spikes — they may signal data theft. "
            "5. Regularly scan for malware using this KAIROS assistant and Windows Defender. "
            "6. Avoid running programs with administrator rights unless absolutely necessary. "
            "7. Back up your important data regularly to prevent ransomware damage. "
            "8. Use a firewall and block unused network ports. "
            "I'll keep watching your processes 24/7 for any threat indicators."
        )
        quick_tips = [
            "Enable Windows Defender real-time protection",
            "Block PowerShell for standard user accounts",
            "Monitor unusual network outbound connections",
            "Disable autorun for USB drives",
        ]

    # ── NETWORK ───────────────────────────────────────────────────────────
    elif intent == "network":
        net_recv = metrics["network"]["recv_kb_s"]
        net_sent = metrics["network"]["sent_kb_s"]
        total_net = net_recv + net_sent
        if total_net > 10000:  # > 10 MB/s
            alert_level = "WARNING"
            response_text = (
                f"⚠️ HIGH network activity detected! Receiving {net_recv} KB/s, Sending {net_sent} KB/s. "
                "This level of traffic could indicate data exfiltration or a botnet. "
                "Check which process is using the network using Resource Monitor. "
                "Consider blocking suspicious outbound connections in your firewall."
            )
        else:
            response_text = (
                f"Network activity is normal. Receiving {net_recv} KB/s, Sending {net_sent} KB/s. "
                "No unusual network patterns detected. "
                "For security, ensure your firewall is active and port 445 (SMB) is blocked from internet access."
            )
        quick_tips = [
            "Use Windows Firewall to block suspicious IPs",
            "Port 4444 is Metasploit's default — block it",
            "Monitor outbound connections with Wireshark",
            "Enable Network Protection in Windows Defender",
        ]

    # ── HELP ──────────────────────────────────────────────────────────────
    elif intent == "help":
        response_text = (
            "I'm KAIROS Security Guard! Here's what I can do: "
            "1. SCAN FOR THREATS — say 'scan for malicious processes' or 'check for viruses'. "
            "2. SYSTEM STATUS — say 'show system status' or 'how is my CPU'. "
            "3. TOP PROCESSES — say 'show top processes' or 'what is using my CPU'. "
            "4. SECURITY ADVICE — say 'give me security advice' or 'how to protect my system'. "
            "5. NETWORK MONITOR — say 'check network' or 'any suspicious connections'. "
            "6. PROCESS MANAGEMENT — say 'how to kill a process'. "
            "You can type or use the microphone button to speak your query!"
        )
        quick_tips = [
            "Click the microphone icon to speak",
            "Click the speaker icon to hear responses",
            "Threats are highlighted in red with severity levels",
            "Run a scan every time you install new software",
        ]

    # ── GENERAL FALLBACK ──────────────────────────────────────────────────
    else:
        # Still run a quick scan as default context
        scan = scan_for_malicious_processes()
        threats_found = scan["threats"]
        response_text = (
            f"I'm your KAIROS Security Guard. Currently monitoring {proc_count} processes "
            f"with CPU at {cpu_pct}% and Memory at {mem_pct}%. "
        )
        if threats_found:
            alert_level = "CRITICAL"
            response_text += (
                f"⚠️ URGENT: I detected {len(threats_found)} suspicious process(es) right now! "
                "Ask me to 'scan for threats' for details."
            )
        else:
            response_text += (
                "No immediate threats detected. "
                "Ask me to 'scan for threats', 'show system status', or 'give security advice'."
            )
        quick_tips = ["Say 'help' to see all available commands"]

    return {
        "response": response_text,
        "intent": intent,
        "alert_level": alert_level,
        "threats": threats_found,
        "suspicious": suspicious_found,
        "quick_tips": quick_tips,
        "metrics_snapshot": {
            "cpu": cpu_pct,
            "memory": mem_pct,
            "processes": proc_count,
        }
    }
