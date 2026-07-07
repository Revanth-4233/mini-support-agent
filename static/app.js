/* ═══════════════════════════════════════════════════
   Mini Support Agent — Frontend Logic
   ═══════════════════════════════════════════════════ */

(() => {
  "use strict";

  // ── DOM refs ──
  const chatMessages    = document.getElementById("chatMessages");
  const chatForm        = document.getElementById("chatForm");
  const chatInput       = document.getElementById("chatInput");
  const sendBtn         = document.getElementById("sendBtn");
  const tabBar          = document.getElementById("tabBar");
  const reasoningSteps  = document.getElementById("reasoningSteps");
  const reasoningEmpty  = document.getElementById("reasoningEmpty");
  const sourcesList     = document.getElementById("sourcesList");
  const routeContainer  = document.getElementById("routeBadgeContainer");
  const ordersBody      = document.getElementById("ordersBody");
  const policiesGrid    = document.getElementById("policiesGrid");

  // ══════════════════════════════════════════
  // 1.  WELCOME MESSAGE
  // ══════════════════════════════════════════
  function showWelcome() {
    addAgentMessage(
      `👋 <strong>Welcome!</strong> I'm your AI support assistant.<br>
       Ask me about <strong>order status</strong>, <strong>return policies</strong>, <strong>shipping</strong>, <strong>payments</strong>, or anything else related to your e-commerce experience.<br><br>
       Try one of the quick questions above, or type your own! 🚀`
    );
  }

  // ══════════════════════════════════════════
  // 2.  CHAT HELPERS
  // ══════════════════════════════════════════
  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  function addUserMessage(text) {
    const div = document.createElement("div");
    div.className = "msg user";
    div.textContent = text;
    chatMessages.appendChild(div);
    scrollToBottom();
  }

  function addAgentMessage(html, latencyMs) {
    const div = document.createElement("div");
    div.className = "msg agent";
    div.innerHTML = html;

    if (latencyMs !== undefined) {
      const badge = document.createElement("div");
      badge.className = "latency-badge";
      badge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${latencyMs} ms`;
      div.appendChild(badge);
    }

    chatMessages.appendChild(div);
    scrollToBottom();
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "typing-indicator";
    el.id = "typingIndicator";
    el.innerHTML = "<span></span><span></span><span></span>";
    chatMessages.appendChild(el);
    scrollToBottom();
  }

  function removeTyping() {
    const el = document.getElementById("typingIndicator");
    if (el) el.remove();
  }

  // ── Simple markdown-ish formatter ──
  function formatAnswer(text) {
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold **text**
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Inline code `text`
    html = html.replace(/`(.+?)`/g, "<code>$1</code>");
    // Unordered list lines
    html = html.replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>");
    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, "<ul>$1</ul>");
    // Numbered list
    html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");
    html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, (match) => {
      if (!match.startsWith("<ul>")) return `<ul>${match}</ul>`;
      return match;
    });
    // Line breaks
    html = html.replace(/\n/g, "<br>");

    return html;
  }

  // ══════════════════════════════════════════
  // 3.  REASONING / SOURCES / ROUTE
  // ══════════════════════════════════════════
  function renderReasoning(steps) {
    reasoningSteps.innerHTML = "";
    if (!steps || steps.length === 0) return;
    reasoningEmpty.style.display = "none";

    steps.forEach((s) => {
      const card = document.createElement("div");
      card.className = "step-card";

      const icon = s.status === "done" ? "✅" : s.status === "running" ? "⏳" : "❌";
      card.innerHTML = `
        <div class="step-header">
          <span class="step-status">${icon}</span>
          <span>${escHtml(s.step)}</span>
        </div>
        ${s.result ? `<div class="step-result">${escHtml(s.result)}</div>` : ""}
      `;
      reasoningSteps.appendChild(card);
    });
  }

  function renderSources(sources) {
    sourcesList.innerHTML = "";
    if (!sources || sources.length === 0) return;

    sources.forEach((src) => {
      const tag = document.createElement("span");
      tag.className = "source-tag";
      const score = src.score !== undefined ? (src.score * 100).toFixed(0) + "%" : "";
      tag.innerHTML = `📄 ${escHtml(src.source)}${src.section ? " → " + escHtml(src.section) : ""} ${score ? `<span class="source-score">${score}</span>` : ""}`;
      sourcesList.appendChild(tag);
    });
  }

  function renderRoute(route) {
    routeContainer.innerHTML = "";
    if (!route) return;
    const badge = document.createElement("span");
    badge.className = `route-badge ${route}`;
    const labels = {
      KNOWLEDGE: "📚 Knowledge",
      ORDER_DATA: "📦 Order Data",
      HYBRID: "🔀 Hybrid",
      UNKNOWN: "❓ Unknown"
    };
    badge.textContent = labels[route] || route;
    routeContainer.appendChild(badge);
  }

  // ══════════════════════════════════════════
  // 4.  SEND QUERY
  // ══════════════════════════════════════════
  async function sendQuery(query) {
    if (!query.trim()) return;
    addUserMessage(query);
    chatInput.value = "";
    chatInput.focus();
    showTyping();
    sendBtn.disabled = true;

    try {
      const t0 = performance.now();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const elapsed = data.latency_ms ?? Math.round(performance.now() - t0);

      removeTyping();
      addAgentMessage(formatAnswer(data.answer || "No response."), elapsed);

      // Update right panel
      renderReasoning(data.reasoning_steps);
      renderSources(data.sources);
      renderRoute(data.route);

      // Switch to reasoning tab
      switchTab("reasoning");
    } catch (err) {
      removeTyping();
      addAgentMessage(`⚠️ <strong>Error:</strong> ${escHtml(err.message)}`);
    } finally {
      sendBtn.disabled = false;
    }
  }

  // ── Form / Enter ──
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendQuery(chatInput.value);
  });

  // ══════════════════════════════════════════
  // 5.  QUICK CHIPS
  // ══════════════════════════════════════════
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const q = chip.dataset.query;
      if (q) sendQuery(q);
    });
  });

  // ══════════════════════════════════════════
  // 6.  TABS
  // ══════════════════════════════════════════
  function switchTab(name) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    document.querySelectorAll(".tab-content").forEach((tc) => tc.classList.toggle("active", tc.id === `tab-${name}`));
  }

  tabBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (btn) switchTab(btn.dataset.tab);
  });

  // ══════════════════════════════════════════
  // 7.  ORDERS TABLE
  // ══════════════════════════════════════════
  async function loadOrders() {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const orders = await res.json();

      if (!orders.length) {
        ordersBody.innerHTML = `<tr><td colspan="9" class="loading-cell">No orders found.</td></tr>`;
        return;
      }

      ordersBody.innerHTML = orders.map((o) => {
        const statusClass = `status-${(o.status || "").toLowerCase()}`;
        return `<tr>
          <td class="order-id">${escHtml(o.order_id)}</td>
          <td>${escHtml(o.customer_name)}</td>
          <td>${escHtml(o.product)}</td>
          <td>${escHtml(o.category)}</td>
          <td>₹${Number(o.amount_inr).toLocaleString("en-IN")}</td>
          <td>${escHtml(o.order_date)}</td>
          <td><span class="status ${statusClass}">${escHtml(o.status)}</span></td>
          <td>${escHtml(o.payment_method)}</td>
          <td>${escHtml(o.pincode)}</td>
        </tr>`;
      }).join("");
    } catch (err) {
      ordersBody.innerHTML = `<tr><td colspan="9" class="loading-cell">⚠️ Failed to load orders: ${escHtml(err.message)}</td></tr>`;
    }
  }

  // ══════════════════════════════════════════
  // 8.  POLICIES CARDS
  // ══════════════════════════════════════════
  function renderPolicies() {
    const policies = [
      {
        icon: "🚚",
        title: "Shipping Policy",
        items: [
          "Standard delivery: 4–7 business days across India",
          "Express delivery: 1–2 business days (Tier 1 cities only, ₹99 extra)",
          "Free standard shipping on orders above ₹999",
          "Orders are processed within 24 hours of confirmation",
          "Orders placed after 6 PM IST are processed the next business day",
          "We currently do not support international shipping"
        ]
      },
      {
        icon: "↩️",
        title: "Return & Refund Policy",
        items: [
          "Standard items: 7-day return window (must be unused & original packaging)",
          "Electronics & appliances: Shorter 3-day return window",
          "Non-returnable: Cosmetics, innerwear, and perishable goods",
          "Damaged/defective items must be reported within 48 hours with photo evidence",
          "Refunds processed within 5–7 business days to original payment method",
          "COD orders are refunded via bank transfer or instant store credit"
        ]
      },
      {
        icon: "💳",
        title: "Payment & Pricing",
        items: [
          "Accepted: UPI, Credit/Debit Cards, Net Banking, and COD",
          "COD is available only for orders under ₹5,000",
          "COD handling fee of ₹40 applies to all COD orders",
          "Only one coupon code can be applied per order",
          "Coupons cannot be combined with active sale discounts",
          "All displayed prices are inclusive of GST"
        ]
      },
      {
        icon: "👤",
        title: "Account & Support FAQ",
        items: [
          "Support available via chat and WhatsApp from 9 AM to 9 PM IST daily",
          "Email support responses may take up to 24 hours",
          "Orders can be cancelled free of charge before shipment status",
          "Once status is 'Shipped', order cannot be cancelled (must use returns)",
          "Multiple failed login attempts lock account for 30 minutes",
          "Loyalty: Earn 1 point per ₹100 spent (1 point = ₹1, max 20% order value)"
        ]
      }
    ];

    policiesGrid.innerHTML = policies.map((p) => `
      <div class="policy-card">
        <div class="policy-card-icon">${p.icon}</div>
        <div class="policy-card-title">${p.title}</div>
        <ul>${p.items.map((i) => `<li>${i}</li>`).join("")}</ul>
      </div>
    `).join("");
  }

  // ══════════════════════════════════════════
  // UTILS
  // ══════════════════════════════════════════
  function escHtml(str) {
    if (str === undefined || str === null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ══════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════
  showWelcome();
  loadOrders();
  renderPolicies();
  chatInput.focus();
})();
