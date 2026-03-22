// chatdashboard.js - Chat and Inquiry Management

async function checkForInquiries() {
  // Silent badge update only — never shows popup
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/agent/inquiry-count`, {
      method: 'GET', credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      updateInquiryBadge(data.inquiry_count || 0);
    }
  } catch (error) {
    console.error('Error checking inquiries:', error);
  }
}

// Called on page load — badge only, NO popup
async function checkForInquiriesOnLoad() {
  await checkForInquiries();
}

function updateInquiryBadge(count) {
  const badge = document.getElementById('inquiryBadge');
  if (badge) {
    if (count > 0) {
      badge.textContent = `🔴 ${count} ${count === 1 ? 'Inquiry' : 'Inquiries'}`;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
}

// ✅ Only called when a NEW message arrives via socket
function showInquiryNotification(count) {
  if (document.getElementById('inquiryNotificationModal')) return;

  const modal = document.createElement('div');
  modal.id = 'inquiryNotificationModal';
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(26, 0, 31, 0.8);
    display: flex; align-items: center; justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  `;

  modal.innerHTML = `
    <div style="background:#3b0047;border-radius:15px;max-width:400px;width:90%;padding:25px;box-shadow:0 8px 35px rgba(255,77,210,0.4);border:2px solid rgba(255,77,210,0.3);animation:slideUp 0.3s ease;">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="width:60px;height:60px;background:rgba(255,77,210,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;border:2px solid #ff4dd2;">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ff4dd2" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <h3 style="margin:0 0 10px;color:#ff4dd2;font-size:1.3rem;font-weight:600;">New ${count === 1 ? 'Inquiry' : 'Inquiries'}</h3>
        <p style="margin:0;color:#e0e0e0;font-size:0.95rem;line-height:1.5;">You have <strong style="color:#ff9900;">${count}</strong> new ${count === 1 ? 'inquiry' : 'inquiries'} waiting for your response.</p>
      </div>
      <button id="viewInquiriesBtn" style="width:100%;padding:12px;background:linear-gradient(135deg,#ff4dd2,#ff9900);color:white;border:none;border-radius:10px;cursor:pointer;font-size:0.95rem;font-weight:600;margin-bottom:8px;">View Inquiries</button>
      <button id="closeInquiryNotification" style="width:100%;padding:12px;background:transparent;color:#ff4dd2;border:2px solid #ff4dd2;border-radius:10px;cursor:pointer;font-size:0.95rem;font-weight:600;">Close</button>
    </div>
    <style>@keyframes slideUp { from { transform:translateY(20px);opacity:0; } to { transform:translateY(0);opacity:1; } }</style>
  `;

  document.body.appendChild(modal);
  document.getElementById('viewInquiriesBtn').onclick = () => { modal.remove(); document.querySelector('a[data-target="listings"]')?.click(); };
  document.getElementById('closeInquiryNotification').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function openAgentChat(propertyId) {
  showConversationSelector(propertyId);
}

async function showConversationSelector(propertyId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/property/${propertyId}/conversations`, {
      method: 'GET', credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      const conversations = data.conversations || [];
      if (conversations.length === 0) { await showCustomAlert('No inquiries found for this property.'); return; }
      if (conversations.length === 1) { openChatWindow(conversations[0].conversation_id, propertyId); return; }
      displayConversationSelector(conversations, propertyId);
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
    await showCustomAlert('Failed to load conversations.');
  }
}

function displayConversationSelector(conversations, propertyId) {
  const modal = document.createElement('div');
  modal.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(26,0,31,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;`;

  let listHTML = '';
  conversations.forEach((conv) => {
    const unreadBadge = conv.unread_count > 0
      ? `<span style="background:#ff4444;color:white;padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:600;">${conv.unread_count} new</span>`
      : '';
    const time = conv.last_message_time
      ? new Date(conv.last_message_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'No messages yet';
    listHTML += `
      <div class="conv-item" data-id="${conv.conversation_id}" style="padding:16px;border-bottom:1px solid rgba(255,77,210,0.15);cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
            <strong style="color:#fff;">${escapeHtml(conv.user_name || 'User')}</strong>${unreadBadge}
          </div>
          <div style="color:#999;font-size:0.85rem;">${escapeHtml(conv.last_message || 'Click to view')}</div>
          <div style="color:#666;font-size:0.75rem;margin-top:4px;">${time}</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4dd2" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>`;
  });

  modal.innerHTML = `
    <div style="background:#2d0036;border-radius:10px;max-width:500px;width:90%;max-height:70vh;box-shadow:0 4px 20px rgba(0,0,0,0.4);border:1px solid rgba(255,77,210,0.2);overflow:hidden;display:flex;flex-direction:column;">
      <div style="background:linear-gradient(135deg,#ff4dd2,#ff9900);padding:18px;display:flex;justify-content:space-between;align-items:center;">
        <h3 style="margin:0;color:white;font-size:1.2rem;">Select Conversation (${conversations.length})</h3>
        <button class="close-modal" style="background:rgba(255,255,255,0.15);border:none;color:white;font-size:22px;cursor:pointer;width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;">&times;</button>
      </div>
      <div style="flex:1;overflow-y:auto;">${listHTML}</div>
    </div>
    <style>.conv-item:hover{background:rgba(255,77,210,0.1);}</style>
  `;

  document.body.appendChild(modal);
  modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
  modal.querySelectorAll('.conv-item').forEach(item => {
    item.addEventListener('click', () => { modal.remove(); openChatWindow(item.dataset.id, propertyId); });
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

async function openChatWindow(conversationId, propertyId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
      method: 'GET', credentials: 'include'
    });
    const data = await response.json();
    const messages = data.messages || [];
    const currentUserId = await getCurrentAgentId();

    let clientName = 'Client';
    const clientMsg = messages.find(m => String(m.sender_id) !== String(currentUserId));
    if (clientMsg) clientName = clientMsg.sender_name || 'Client';

    document.getElementById('agentChatOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'agentChatOverlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%; height: 100dvh;
      background: #1a001f;
      display: flex; flex-direction: column;
      z-index: 10001; overflow: hidden;
    `;

    overlay.innerHTML = `
      <div style="background:linear-gradient(135deg,#ff4dd2 0%,#ff9900 100%);padding:16px 20px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:44px;height:44px;background:rgba(255,255,255,0.25);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.4);flex-shrink:0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <div>
            <h3 style="margin:0;color:white;font-size:1.1rem;font-weight:600;">${escapeHtml(clientName)}</h3>
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:0.8rem;">Property Inquiry</p>
          </div>
        </div>
        <button id="closeAgentChat" style="background:rgba(255,255,255,0.2);border:none;color:white;font-size:22px;cursor:pointer;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">&times;</button>
      </div>

      <div id="agentChatMessages" style="flex:1;overflow-y:auto;padding:16px;background:#1a001f;min-height:0;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;"></div>

      <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#2d0036;border-top:1px solid rgba(255,77,210,0.2);flex-shrink:0;position:sticky;bottom:0;">
        <input type="text" id="agentChatInput" placeholder="Type your reply..."
          style="flex:1;padding:12px 16px;border:2px solid rgba(255,77,210,0.3);border-radius:25px;font-size:0.95rem;background:#3b0047;color:#fff;outline:none;min-width:0;" />
        <button id="agentSendMessage" style="padding:12px 20px;background:linear-gradient(135deg,#ff4dd2,#ff9900);color:white;border:none;border-radius:25px;cursor:pointer;font-weight:600;font-size:0.9rem;display:flex;align-items:center;gap:6px;flex-shrink:0;white-space:nowrap;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          Send
        </button>
      </div>

      <style>
        #agentChatInput:focus { border-color: #ff4dd2 !important; }
        #agentChatInput::placeholder { color: #999; }
        #closeAgentChat:hover { background: rgba(255,255,255,0.35) !important; }
        #agentChatMessages::-webkit-scrollbar { width: 6px; }
        #agentChatMessages::-webkit-scrollbar-thumb { background: rgba(255,77,210,0.3); border-radius: 10px; }
      </style>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    messages.forEach(msg => appendAgentMessage(msg, currentUserId));
    const msgContainer = document.getElementById('agentChatMessages');
    if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;

    document.getElementById('agentChatInput').addEventListener('focus', () => {
      setTimeout(() => { if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight; }, 350);
    });

    document.getElementById('closeAgentChat').onclick = async () => {
      overlay.remove();
      document.body.style.overflow = '';
      await checkForInquiries();
      const agentId = await getCurrentAgentId();
      if (agentId) await loadAgentPropertiesWithInquiries(agentId);
    };

    document.getElementById('agentSendMessage').onclick = () => sendAgentMessage(conversationId, propertyId, currentUserId);
    document.getElementById('agentChatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendAgentMessage(conversationId, propertyId, currentUserId);
    });

  } catch (error) {
    console.error('Error loading conversation:', error);
    await showCustomAlert('Failed to open chat window.');
  }
}

function appendAgentMessage(message, currentUserId) {
  const container = document.getElementById('agentChatMessages');
  if (!container) return;

  const isOwn = String(message.sender_id) === String(currentUserId);
  const timestamp = new Date(message.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `margin-bottom:16px;display:flex;flex-direction:column;align-items:${isOwn ? 'flex-end' : 'flex-start'};`;

  const label = document.createElement('div');
  label.style.cssText = `font-size:0.75rem;color:${isOwn ? '#4ade80' : '#ff4dd2'};font-weight:600;margin-bottom:4px;padding:0 12px;`;
  label.textContent = isOwn ? 'You' : escapeHtml(message.sender_name || 'Client');

  const bubble = document.createElement('div');
  bubble.style.cssText = `
    max-width:75%;padding:12px 16px;word-break:break-word;
    border-radius:${isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px'};
    background:${isOwn ? 'rgba(34,197,94,0.2)' : '#3b0047'};
    color:white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
    border:1px solid ${isOwn ? 'rgba(74,222,128,0.4)' : 'rgba(255,77,210,0.2)'};
  `;
  bubble.innerHTML = `
    <div style="margin-bottom:6px;line-height:1.4;font-size:0.95rem;">${escapeHtml(message.message_text)}</div>
    <div style="font-size:0.7rem;opacity:0.7;text-align:${isOwn ? 'right' : 'left'};">${timestamp}</div>
  `;

  wrapper.appendChild(label);
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
}

async function sendAgentMessage(conversationId, propertyId, currentUserId) {
  const input = document.getElementById('agentChatInput');
  const messageText = input.value.trim();
  if (!messageText) return;

  appendAgentMessage({
    sender_id: currentUserId,
    sender_name: 'You',
    message_text: messageText,
    created_at: new Date().toISOString()
  }, currentUserId);

  input.value = '';
  const msgs = document.getElementById('agentChatMessages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message_text: messageText })
    });

    if (response.ok) {
      markAgentMessagesAsRead(conversationId);
      checkForInquiries();
      const agentId = await getCurrentAgentId();
      if (agentId) loadAgentPropertiesWithInquiries(agentId);
    } else {
      const err = await response.json();
      showErrorModal('Failed to send: ' + (err.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error sending message:', error);
    showErrorModal('Error sending message');
  }
}

async function markAgentMessagesAsRead(conversationId) {
  try {
    await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/read`, {
      method: 'PUT', credentials: 'include'
    });
  } catch (error) {
    console.error('Error marking as read:', error);
  }
}

// ============================================
// SOCKET — new inquiry popup ONLY when a new
// message arrives from a client via socket
// ============================================
async function initAgentSocketNotifications() {
  if (window._agentSocketInitialized) return;
  window._agentSocketInitialized = true;

  try {
    // ✅ Get token via API (same as auth me — uses httpOnly cookie)
    const authRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET', credentials: 'include'
    });
    if (!authRes.ok) return;
    const authData = await authRes.json();
    const token = authData.token;
    if (!token) return;

    const notifSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    notifSocket.on('connect', () => {
      console.log('✅ Agent notification socket connected');
    });

    // ✅ New message from a client — show popup ONLY if chat is not open
    notifSocket.on('new_message_notification', async () => {
      const chatOpen = !!document.getElementById('agentChatOverlay');
      if (chatOpen) return; // Agent is already in the chat, no need for popup

      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/agent/inquiry-count`, {
          method: 'GET', credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          const count = data.inquiry_count || 0;
          updateInquiryBadge(count);
          if (count > 0) {
            showInquiryNotification(count);
          }
        }
      } catch (e) {
        console.error('Notification fetch error:', e);
      }
    });

    notifSocket.on('connect_error', (err) => {
      console.error('Agent notification socket error:', err.message);
    });

  } catch (e) {
    console.error('Agent socket notification init error:', e);
  }
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAgentSocketNotifications);
} else {
  initAgentSocketNotifications();
}