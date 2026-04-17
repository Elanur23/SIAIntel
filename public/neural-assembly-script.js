// ─────────────────────────────────────────────
// Mock data representing a live pipeline run
// ─────────────────────────────────────────────
const MOCK_REPORTS = [
  {
    article_id: "SIA-2026-TR-001",
    language: "TR",
    title: "Türkiye Piyasaları: Sistemik Dengelenme Süreci Başladı",
    overall_score: 8.4,
    cms_ready: true,
    processing_ms: 4820,
    trust_box: {
      content_sha256: "a3f8c2d94e1b07f56a29d3c8e0b4f712a3c9d5e8f1b2c4a6d8e0f3b5c7d9e1f",
      confidence_score: 0.8860,
      verified_at: "2026-03-24T09:14:33Z",
      pipeline_version: "SIA-v4.0-NeuralAssemblyLine",
      eeat_signals: {
        expertise_score: 8.7,
        fact_check_confidence: 0.913,
        lsi_keyword_count: 10,
        semantic_density: 0.78
      },
      institutional_metadata: { adsense_safety: 9.3 },
      audit_cells_passed: 7,
      audit_cells_total: 7,
    },
    cells: {
      title: {
        status: "PASSED",
        score: 8.5,
        latency_ms: 1240,
        autofix_rounds: 0,
        issues: ["Title slightly long (72 chars)"]
      },
      meta: {
        status: "PASSED",
        score: 8.1,
        latency_ms: 980,
        autofix_rounds: 0,
        issues: []
      },
      body: {
        status: "FIXED",
        score: 8.6,
        latency_ms: 2100,
        autofix_rounds: 1,
        issues: ["Low initial semantic density", "Opening paragraph lacked E-E-A-T signals"]
      },
      fact_check: {
        status: "PASSED",
        score: 9.1,
        latency_ms: 1850,
        autofix_rounds: 0,
        issues: []
      },
      schema: {
        status: "PASSED",
        score: 8.0,
        latency_ms: 1100,
        autofix_rounds: 0,
        issues: ["Missing 'author' field — auto-added"]
      },
      sovereign_compliance: {
        status: "PASSED",
        score: 9.3,
        latency_ms: 760,
        autofix_rounds: 0,
        issues: [],
        changes: [
          "'ekonomik çöküş' → 'sistemik dengelenme'",
          "'alarm verici' → 'dikkat çekici'",
          "'en kötü dönem' → 'tarihi açıdan zorlu dönem'"
        ]
      },
      speedcell: {
        status: "PASSED",
        score: 9.2,
        latency_ms: 3420,
        autofix_rounds: 0,
        issues: [],
        actions: {
          indexAPI: "Google: 9/9, Bing: 9/9, IndexNow: 9/9",
          hreflang: "81 reciprocal links validated",
          sitemap: "18 entries, published 2.3 min ago",
          ping: "135 aggregators, 128 successful"
        }
      },
    },
    sovereign_changes: [
      "'ekonomik çöküş' → 'sistemik dengelenme' (×2)",
      "'alarm verici' → 'dikkat çekici' (×1)",
      "'en kötü dönem' → 'tarihi açıdan zorlu dönem' (×1)",
    ],
  },

  {
    article_id: "SIA-2026-EN-042",
    language: "EN",
    title: "Global Equity Markets Undergo Significant Repricing",
    overall_score: 7.9,
    cms_ready: true,
    processing_ms: 5310,
    trust_box: {
      content_sha256: "b7e2a4c1f8d3e9b5c2a7d4f1e8b3c6a9d2f5e8b1c4a7d0f3e6b9c2a5d8f1e4b",
      confidence_score: 0.8210,
      verified_at: "2026-03-24T09:14:41Z",
      pipeline_version: "SIA-v4.0-NeuralAssemblyLine",
      eeat_signals: {
        expertise_score: 8.2,
        fact_check_confidence: 0.872,
        lsi_keyword_count: 9,
        semantic_density: 0.71
      },
      institutional_metadata: { adsense_safety: 8.8 },
      audit_cells_passed: 7,
      audit_cells_total: 7,
    },
    cells: {
      title: {
        status: "FIXED",
        score: 8.2,
        latency_ms: 1300,
        autofix_rounds: 1,
        issues: ["Sensational original title", "'Freefall' and 'Crash' replaced"]
      },
      meta: {
        status: "FIXED",
        score: 7.9,
        latency_ms: 1050,
        autofix_rounds: 1,
        issues: ["'Devastating' and 'panic' flagged as sensational", "'debt crisis' → 'fiscal consolidation challenge'"]
      },
      body: {
        status: "PASSED",
        score: 7.6,
        latency_ms: 2250,
        autofix_rounds: 0,
        issues: ["Some informal phrasing"]
      },
      fact_check: {
        status: "PASSED",
        score: 8.5,
        latency_ms: 1920,
        autofix_rounds: 0,
        issues: []
      },
      schema: {
        status: "PASSED",
        score: 7.8,
        latency_ms: 1200,
        autofix_rounds: 0,
        issues: []
      },
      sovereign_compliance: {
        status: "PASSED",
        score: 8.8,
        latency_ms: 820,
        autofix_rounds: 0,
        issues: []
      },
    },
    sovereign_changes: [
      "'stock market crash' → 'equity market repricing' (×1)",
      "'catastrophic meltdown' → 'significant liquidity stress event' (×1)",
      "'mass layoffs' → 'workforce restructuring initiative' (×1)",
      "'devastating' → 'significant' (×2)",
      "'panic' → 'heightened public concern' (×1)",
    ],
  },

  {
    article_id: "SIA-2026-DE-018",
    language: "DE",
    title: "Bundesbank Signalisiert Strukturelle Anpassung im Finanzsektor",
    overall_score: 8.9,
    cms_ready: true,
    processing_ms: 3940,
    trust_box: {
      content_sha256: "c9f1e3b5d7a2c8f4e0b6d2a9f5c1e7b3d9a5c0f6e2b8d4a1f7c3e9b5d1a7f3c",
      confidence_score: 0.9120,
      verified_at: "2026-03-24T09:14:28Z",
      pipeline_version: "SIA-v4.0-NeuralAssemblyLine",
      eeat_signals: {
        expertise_score: 9.1,
        fact_check_confidence: 0.941,
        lsi_keyword_count: 11,
        semantic_density: 0.83
      },
      institutional_metadata: { adsense_safety: 9.6 },
      audit_cells_passed: 7,
      audit_cells_total: 7,
    },
    cells: {
      title: {
        status: "PASSED",
        score: 9.2,
        latency_ms: 1100,
        autofix_rounds: 0,
        issues: []
      },
      meta: {
        status: "PASSED",
        score: 8.8,
        latency_ms: 900,
        autofix_rounds: 0,
        issues: []
      },
      body: {
        status: "PASSED",
        score: 9.0,
        latency_ms: 1940,
        autofix_rounds: 0,
        issues: []
      },
      fact_check: {
        status: "PASSED",
        score: 9.3,
        latency_ms: 1700,
        autofix_rounds: 0,
        issues: []
      },
      schema: {
        status: "PASSED",
        score: 8.7,
        latency_ms: 1050,
        autofix_rounds: 0,
        issues: []
      },
      sovereign_compliance: {
        status: "PASSED",
        score: 9.6,
        latency_ms: 710,
        autofix_rounds: 0,
        issues: []
      },
    },
    sovereign_changes: [
      "'Finanzkrise' → 'fiskalische Konsolidierungsphase' (×1)",
    ],
  },
];

const LANGUAGES = ["TR", "EN", "DE", "FR", "ES", "AR", "RU", "ZH", "JA"];
const LANG_COLORS = {
  TR: "#ff6b35",
  EN: "#00c8ff",
  DE: "#ffc840",
  FR: "#0066ff",
  ES: "#e83f6f",
  AR: "#00e5a0",
  RU: "#9966ff",
  ZH: "#ff4060",
  JA: "#ff9f1c"
};

let activeIdx = 0;

function scoreColor(s) {
  if (s >= 8.5) return 'var(--green)';
  if (s >= 7.0) return 'var(--accent)';
  if (s >= 5.5) return 'var(--yellow)';
  return 'var(--red)';
}

function badgeClass(status) {
  return {
    PASSED: 'badge-passed',
    FIXED: 'badge-fixed',
    FAILED: 'badge-failed',
    PENDING: 'badge-pending',
    RUNNING: 'badge-running'
  }[status] || 'badge-pending';
}

function cardClass(status) {
  return status.toLowerCase();
}


function buildSidebar() {
  // Article list
  const list = document.getElementById('articleList');
  list.innerHTML = MOCK_REPORTS.map((r, i) => `
    <div class="article-item ${i === activeIdx ? 'active' : ''}" onclick="selectArticle(${i})">
      <div class="art-id">${r.article_id}</div>
      <span class="art-lang">${r.language}</span>
      <div class="art-title">${r.title.substring(0, 55)}${r.title.length > 55 ? '…' : ''}</div>
      <div class="art-score" style="color:${scoreColor(r.overall_score)}">
        ${r.overall_score.toFixed(1)} / 10
        ${r.cms_ready ? '<span style="color:var(--green);font-size:10px">✓ CMS READY</span>' : '<span style="color:var(--red);font-size:10px">✗ HOLD</span>'}
      </div>
    </div>
  `).join('');

  // Language matrix
  const mat = document.getElementById('langMatrix');
  mat.innerHTML = LANGUAGES.map(l => {
    const rep = MOCK_REPORTS.find(r => r.language === l);
    const c = LANG_COLORS[l];
    return `<div style="width:38px;height:38px;border-radius:6px;border:1px solid ${c}33;background:${c}11;display:grid;place-items:center;font-family:var(--mono);font-size:11px;font-weight:600;color:${c};cursor:default;title:${l}">${l}</div>`;
  }).join('');
}

function selectArticle(i) {
  activeIdx = i;
  buildSidebar();
  renderDash();
}


function renderDash() {
  const r = MOCK_REPORTS[activeIdx];
  const el = document.getElementById('dashContent');
  const cellEntries = Object.entries(r.cells);
  const totalLatency = cellEntries.reduce((s, [, c]) => s + c.latency_ms, 0);
  const fixedCells = cellEntries.filter(([, c]) => c.status === 'FIXED').length;
  const langColor = LANG_COLORS[r.language] || 'var(--accent)';

  el.innerHTML = `
    <!-- Metric row -->
    <div class="metric-row" style="margin-bottom:0">
      <div class="metric-card" style="--accent-color:${scoreColor(r.overall_score)}">
        <div class="metric-label">Overall Score</div>
        <div class="metric-value">${r.overall_score.toFixed(1)}</div>
        <div class="metric-sub">${r.cms_ready ? '✓ CMS Ready' : '⚠ Review Required'}</div>
      </div>
      <div class="metric-card" style="--accent-color:var(--green)">
        <div class="metric-label">Cells Passed</div>
        <div class="metric-value">${r.trust_box.audit_cells_passed}/${r.trust_box.audit_cells_total}</div>
        <div class="metric-sub">${fixedCells} auto-fixed</div>
      </div>
      <div class="metric-card" style="--accent-color:var(--yellow)">
        <div class="metric-label">Pipeline Time</div>
        <div class="metric-value">${(r.processing_ms / 1000).toFixed(2)}s</div>
        <div class="metric-sub">${(totalLatency / 1000).toFixed(1)}s total cell latency</div>
      </div>
      <div class="metric-card" style="--accent-color:${langColor}">
        <div class="metric-label">Language</div>
        <div class="metric-value" style="font-size:22px">${r.language}</div>
        <div class="metric-sub" style="font-family:var(--mono);font-size:10px">${r.article_id}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div>
      <div class="tabs">
        <div class="tab active" onclick="switchTab('cells',this)">⬡ Audit Cells</div>
        <div class="tab" onclick="switchTab('trust',this)">🔐 Trust Box</div>
        <div class="tab" onclick="switchTab('sovereign',this)">⚖ Sovereign Log</div>
        <div class="tab" onclick="switchTab('schema',this)">{ } Schema</div>
      </div>

      <!-- CELLS TAB -->
      <div class="tab-content active" id="tab-cells">
        <div class="cells-grid">
          ${cellEntries.map(([name, cell]) => {
            const barColor = scoreColor(cell.score);
            return `
              <div class="cell-card ${cardClass(cell.status)}">
                <div class="cell-header">
                  <div class="cell-name">${name.replace(/_/g, ' ').toUpperCase()}</div>
                  <div class="cell-badge ${badgeClass(cell.status)}">${cell.status}</div>
                </div>
                <div class="score-bar-wrap">
                  <div class="score-bar">
                    <div class="score-bar-fill" style="width:${cell.score * 10}%;background:${barColor}"></div>
                  </div>
                  <div class="score-val" style="color:${barColor}">${cell.score.toFixed(1)}</div>
                </div>
                <div class="cell-meta">
                  <div class="cell-meta-item">⏱ <span>${cell.latency_ms.toFixed(0)}ms</span></div>
                  ${cell.autofix_rounds > 0 ? `<div class="cell-meta-item">🔧 <span>${cell.autofix_rounds} fix round${cell.autofix_rounds > 1 ? 's' : ''}</span></div>` : ''}
                </div>
                ${cell.issues && cell.issues.length > 0 ? `
                  <ul class="issues-list">
                    ${cell.issues.slice(0, 3).map(i => `<li class="warn">${i}</li>`).join('')}
                  </ul>
                ` : '<div style="font-size:11px;color:var(--green);font-family:var(--mono)">✓ No issues</div>'}
              </div>
            `;
          }).join('')}
        </div>
      </div>


      <!-- TRUST TAB -->
      <div class="tab-content" id="tab-trust">
        <div class="trust-box">
          <div class="trust-box-header">
            <div class="trust-icon">🔐</div>
            <div>
              <div class="trust-title">E-E-A-T TRUST BOX — CRYPTOGRAPHIC VERIFICATION</div>
              <div style="font-size:11px;color:var(--text2);font-family:var(--mono)">${r.trust_box.verified_at}</div>
            </div>
          </div>
          <div class="trust-grid">
            <div class="trust-field" style="grid-column:1/-1">
              <div class="trust-key">SHA-256 CONTENT HASH</div>
              <div class="trust-val hash">${r.trust_box.content_sha256}</div>
            </div>
            <div class="trust-field">
              <div class="trust-key">CONFIDENCE SCORE</div>
              <div class="trust-val hi">${(r.trust_box.confidence_score * 100).toFixed(1)}%</div>
            </div>
            <div class="trust-field">
              <div class="trust-key">ADSENSE SAFETY</div>
              <div class="trust-val hi">${r.trust_box.institutional_metadata.adsense_safety}/10</div>
            </div>
            <div class="trust-field">
              <div class="trust-key">EXPERTISE SCORE (E-E-A-T)</div>
              <div class="trust-val hi">${r.trust_box.eeat_signals.expertise_score}/10</div>
            </div>
            <div class="trust-field">
              <div class="trust-key">FACT-CHECK CONFIDENCE</div>
              <div class="trust-val hi">${(r.trust_box.eeat_signals.fact_check_confidence * 100).toFixed(1)}%</div>
            </div>
            <div class="trust-field">
              <div class="trust-key">LSI KEYWORDS DETECTED</div>
              <div class="trust-val">${r.trust_box.eeat_signals.lsi_keyword_count}</div>
            </div>
            <div class="trust-field">
              <div class="trust-key">SEMANTIC DENSITY</div>
              <div class="trust-val">${(r.trust_box.eeat_signals.semantic_density * 100).toFixed(0)}%</div>
            </div>
            <div class="trust-field" style="grid-column:1/-1">
              <div class="trust-key">PIPELINE</div>
              <div class="trust-val" style="color:var(--accent)">${r.trust_box.pipeline_version}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- SOVEREIGN TAB -->
      <div class="tab-content" id="tab-sovereign">
        <div class="sov-log">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <div style="font-family:var(--mono);font-size:13px;font-weight:600;color:var(--yellow)">⚖ SOVEREIGN COMPLIANCE LOG</div>
            <div style="font-family:var(--mono);font-size:11px;color:var(--text2)">${r.sovereign_changes.length} substitution${r.sovereign_changes.length !== 1 ? 's' : ''}</div>
          </div>
          <div style="font-size:11px;color:var(--text2);margin-bottom:12px">Golden Rule enforced — high-impact terminology converted to institutional language</div>
          <div class="sov-changes">
            ${r.sovereign_changes.map(c => {
              const parts = c.split(' → ');
              return `<div class="sov-change">${parts[0]}<span class="arrow">→</span>${parts.slice(1).join(' → ')}</div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- SCHEMA TAB -->
      <div class="tab-content" id="tab-schema">
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:20px">
          <div style="font-family:var(--mono);font-size:12px;font-weight:600;color:var(--accent);margin-bottom:14px">{ } SCHEMA.ORG JSON-LD — NewsArticle</div>
          <pre style="font-family:var(--mono);font-size:11px;color:var(--text2);line-height:1.7;overflow-x:auto">${JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": r.title,
            "inLanguage": r.language,
            "datePublished": "2026-03-24T09:00:00Z",
            "dateModified": "2026-03-24T09:14:00Z",
            "author": { "@type": "Organization", "name": "SIA Intelligence Terminal" },
            "publisher": {
              "@type": "Organization",
              "name": "SIA",
              "logo": { "@type": "ImageObject", "url": "https://sia-terminal.com/logo.png" }
            },
            "description": "[Compliant meta description]",
            "keywords": ["finance", "markets", "institutional", "policy"],
            "contentRating": "SIA-Sovereign-Compliance-v4",
            "trustScore": r.trust_box.confidence_score,
          }, null, 2)}</pre>
        </div>
      </div>
    </div>
  `;
}

function switchTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

// Clock
function updateClock() {
  const now = new Date();
  const s = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const el = document.getElementById('clock');
  if (el) el.textContent = s;
}

setInterval(updateClock, 1000);
updateClock();

// Init
buildSidebar();
renderDash();
