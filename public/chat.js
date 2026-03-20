// chat.js - Real-time Chat Client with Socket.io (MOBILE FULLSCREEN)

let socket = null;
let currentConversationId = null;
let currentPropertyId = null;
let currentAgentId = null;
let typingTimeout = null;
let isSocketInitialized = false;
let socketConnectionPromise = null;
let currentUserId = null;

// ============================================
// LOGIN REQUIRED TOAST POPUP
// ============================================
function showLoginToast() {
  const existing = document.getElementById('loginToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'loginToast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
    background: linear-gradient(135deg, #2d0042 0%, #1a0028 100%);
    border: 1px solid rgba(255, 77, 210, 0.4);
    border-radius: 14px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 8px 32px rgba(255, 77, 210, 0.3);
    z-index: 99999;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    max-width: 92vw;
  `;

  toast.innerHTML = `
    <div style="width:38px;height:38px;background:rgba(255,77,210,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1.5px solid rgba(255,77,210,0.4);">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ff4dd2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </div>
    <div style="flex:1;">
      <div style="color:#fff;font-size:0.88rem;font-weight:600;margin-bottom:7px;">Please log in to chat with an agent</div>
      <div style="display:flex;gap:8px;">
        <a href="login.html" style="color:#fff;background:linear-gradient(135deg,#ff4dd2,#ff9900);padding:5px 16px;border-radius:20px;font-size:0.78rem;font-weight:600;text-decoration:none;">Log In</a>
        <a href="signup.html" style="color:#ff4dd2;border:1px solid rgba(255,77,210,0.5);padding:5px 16px;border-radius:20px;font-size:0.78rem;font-weight:600;text-decoration:none;">Sign Up</a>
      </div>
    </div>
    <button onclick="document.getElementById('loginToast').remove()" style="background:none;border:none;color:rgba(255,255,255,0.4);font-size:20px;cursor:pointer;flex-shrink:0;padding:0;line-height:1;">&times;</button>
  `;

  document.body.appendChild(toast);

  // Slide in
  requestAnimationFrame(() => requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }));

  // Auto dismiss after 5s
  setTimeout(() => {
    const el = document.getElementById('loginToast');
    if (el) {
      el.style.transform = 'translateX(-50%) translateY(-100px)';
      setTimeout(() => el.remove(), 400);
    }
  }, 5000);
}

// ============================================
// CUSTOM ALERT POPUP
// ============================================
function showAlert(message) {
  const existing = document.querySelector('.custom-alert-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'custom-alert-overlay';
  overlay.innerHTML = `
    <div class="custom-alert-box">
      <p>${message}</p>
      <button class="custom-alert-btn">OK</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.custom-alert-btn').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ============================================
// GET TOKEN FROM API
// ============================================
async function getAuthToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET', credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      currentUserId = data.user.userId;
      return data.token;
    }
    return null;
  } catch (error) {
    console.error('Error fetching token:', error);
    return null;
  }
}

// ============================================
// INITIALIZE SOCKET CONNECTION
// ============================================
async function initializeSocket() {
  if (socketConnectionPromise) return socketConnectionPromise;

  const token = await getAuthToken();
  if (!token) {
    showLoginToast();
    return Promise.reject(new Error('No token'));
  }

  socketConnectionPromise = new Promise((resolve, reject) => {
    try {
      socket = io(API_BASE_URL, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      const connectionTimeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);

      socket.on('connect', () => {
        clearTimeout(connectionTimeout);
        isSocketInitialized = true;
        resolve(true);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(connectionTimeout);
        socketConnectionPromise = null;
        reject(error);
      });

      socket.on('disconnect', () => {
        isSocketInitialized = false;
        socketConnectionPromise = null;
      });

      socket.on('new_message', (message) => {
        appendUserMessage(message);
        const chatBody = document.getElementById('chatMessages');
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
      });

      socket.on('user_typing', (data) => {
        if (data.conversationId === currentConversationId) showTypingIndicator();
      });

      socket.on('user_stop_typing', (data) => {
        if (data.conversationId === currentConversationId) hideTypingIndicator();
      });

      socket.on('user_online', (data) => {
        if (data.conversationId === currentConversationId) updateAgentOnlineStatus(true);
      });

      socket.on('new_message_notification', () => updateUnreadBadge());

    } catch (error) {
      socketConnectionPromise = null;
      reject(error);
    }
  });

  return socketConnectionPromise;
}

// ============================================
// OPEN CHAT
// ============================================
async function openChat(propertyId, agentId) {
  currentPropertyId = propertyId;
  currentAgentId = agentId;

  try {
    if (!socket || !socket.connected) {
      await initializeSocket();
    }

    const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ property_id: propertyId, agent_id: agentId })
    });

    const data = await response.json();

    if (data.success && data.conversation) {
      currentConversationId = data.conversation.conversation_id;

      if (socket && socket.connected) {
        socket.emit('join_conversation', currentConversationId);
      }

      await loadMessages(currentConversationId);

      const chatPopup = document.getElementById('chatPopup');
      chatPopup.style.display = 'flex';
      setTimeout(() => chatPopup.classList.add('chat-visible'), 10);

      document.body.style.overflow = 'hidden';
      markMessagesAsRead(currentConversationId);

      if (window.innerWidth > 768) {
        document.getElementById('chatInput').focus();
      }

    } else {
      throw new Error(data.message || 'Failed to create conversation');
    }
  } catch (error) {
    console.error('Error opening chat:', error);
    if (error.message === 'No token') {
      showLoginToast();
    } else {
      showAlert('Failed to open chat. Please try again.');
    }
  }
}

// ============================================
// LOAD MESSAGE HISTORY
// ============================================
async function loadMessages(conversationId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
      method: 'GET', credentials: 'include'
    });
    const data = await response.json();

    if (data.success && data.messages) {
      const chatBody = document.getElementById('chatMessages');
      // Preserve greeting bubble
      const greeting = chatBody.querySelector('.greeting-bubble');
      chatBody.innerHTML = '';
      if (greeting) chatBody.appendChild(greeting);

      data.messages.forEach(msg => appendUserMessage(msg));
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  } catch (error) {
    console.error('Error loading messages:', error);
  }
}

// ============================================
// APPEND A SINGLE MESSAGE BUBBLE
// Identical styling to dashboard
// ============================================
function appendUserMessage(message) {
  const chatBody = document.getElementById('chatMessages');
  if (!chatBody) return;

  const isOwn = message.sender_id === currentUserId;
  const timestamp = new Date(message.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    align-items: ${isOwn ? 'flex-end' : 'flex-start'};
  `;

  const label = document.createElement('div');
  label.style.cssText = `
    font-size: 0.75rem;
    color: ${isOwn ? '#4ade80' : '#ff4dd2'};
    font-weight: 600;
    margin-bottom: 4px;
    padding: 0 12px;
  `;
  label.textContent = isOwn ? 'You' : (message.sender_name || 'Agent');

  const bubble = document.createElement('div');
  bubble.style.cssText = `
    max-width: 75%;
    padding: 12px 16px;
    word-break: break-word;
    border-radius: ${isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px'};
    background: ${isOwn ? 'rgba(34, 197, 94, 0.2)' : '#3b0047'};
    color: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    border: 1px solid ${isOwn ? 'rgba(74, 222, 128, 0.4)' : 'rgba(255, 77, 210, 0.2)'};
  `;
  bubble.innerHTML = `
    <div style="margin-bottom:6px;line-height:1.4;font-size:0.95rem;">${escapeHtml(message.message_text)}</div>
    <div style="font-size:0.7rem;opacity:0.7;text-align:${isOwn ? 'right' : 'left'};">${timestamp}</div>
  `;

  wrapper.appendChild(label);
  wrapper.appendChild(bubble);
  chatBody.appendChild(wrapper);
}

// ============================================
// SEND MESSAGE — optimistic append
// ============================================
function sendMessage() {
  const input = document.getElementById('chatInput');
  const messageText = input.value.trim();
  if (!messageText || !currentConversationId) return;

  if (!socket || !socket.connected) {
    showAlert('Not connected to chat server. Please refresh and try again.');
    return;
  }

  appendUserMessage({
    sender_id: currentUserId,
    sender_name: 'You',
    message_text: messageText,
    created_at: new Date().toISOString()
  });

  const chatBody = document.getElementById('chatMessages');
  if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;

  socket.emit('send_message', { conversationId: currentConversationId, messageText });
  input.value = '';
  input.style.height = 'auto';

  if (socket && socket.connected) {
    socket.emit('stop_typing', { conversationId: currentConversationId });
  }
}

// ============================================
// TYPING INDICATOR
// ============================================
function handleTyping() {
  if (!currentConversationId || !socket || !socket.connected) return;
  socket.emit('typing', { conversationId: currentConversationId });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    if (socket && socket.connected) socket.emit('stop_typing', { conversationId: currentConversationId });
  }, 2000);
}

function showTypingIndicator() {
  const chatBody = document.getElementById('chatMessages');
  if (chatBody.querySelector('.typing-indicator')) return;
  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing-indicator';
  typingDiv.style.cssText = 'margin-bottom:16px;display:flex;flex-direction:column;align-items:flex-start;';
  typingDiv.innerHTML = `
    <div style="background:#3b0047;padding:12px 16px;border-radius:20px 20px 20px 4px;border:1px solid rgba(255,77,210,0.2);">
      <div class="typing-dots" style="display:flex;align-items:center;gap:4px;">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
    </div>
  `;
  chatBody.appendChild(typingDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function hideTypingIndicator() {
  document.querySelector('.typing-indicator')?.remove();
}

// ============================================
// MARK MESSAGES AS READ
// ============================================
async function markMessagesAsRead(conversationId) {
  if (socket && socket.connected) socket.emit('mark_as_read', { conversationId });
  try {
    await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/read`, {
      method: 'PUT', credentials: 'include'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

// ============================================
// UPDATE UNREAD BADGE
// ============================================
async function updateUnreadBadge() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/unread-count`, {
      method: 'GET', credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      const badge = document.querySelector('.favourites-badge');
      if (badge) {
        if (data.unread_count > 0) {
          badge.textContent = `${data.unread_count} Replies`;
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }
    }
  } catch (error) {
    console.error('Error updating unread badge:', error);
  }
}

function updateAgentOnlineStatus(isOnline) {
  const el = document.querySelector('.agent-online-status');
  if (el) {
    el.innerHTML = isOnline ? '🟢 Online' : '';
    el.style.display = isOnline ? 'inline-block' : 'none';
  }
}

// ============================================
// CLOSE CHAT
// ============================================
function closeChat() {
  const chatPopup = document.getElementById('chatPopup');
  chatPopup.classList.remove('chat-visible');
  document.body.style.overflow = '';
  setTimeout(() => { chatPopup.style.display = 'none'; }, 300);

  if (socket && socket.connected && currentConversationId) {
    socket.emit('leave_conversation', currentConversationId);
  }

  currentConversationId = null;
  currentPropertyId = null;
  currentAgentId = null;
}

// ============================================
// HELPERS
// ============================================
function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

async function checkAuthentication() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET', credentials: 'include'
    });
    if (response.ok) {
      updateUnreadBadge();
      setInterval(updateUnreadBadge, 30000);
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', function () {

  const closeBtn = document.getElementById('closeChat');
  if (closeBtn) closeBtn.addEventListener('click', closeChat);

  const sendBtn = document.getElementById('sendMessage');
  if (sendBtn) sendBtn.addEventListener('click', sendMessage);

  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    chatInput.addEventListener('input', function () {
      handleTyping();
      autoResizeTextarea(this);
    });
    chatInput.addEventListener('focus', () => {
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          const chatBody = document.getElementById('chatMessages');
          if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
        }, 350);
      }
    });
  }

  const chatAgentBtn = document.getElementById('chatAgentBtn');
  if (chatAgentBtn) {
    chatAgentBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const agentId = this.dataset.agentId;
      const propertyId = this.dataset.propertyId || new URLSearchParams(window.location.search).get('id');
      if (propertyId && agentId) {
        openChat(propertyId, agentId);
      } else {
        showAlert('Property or agent information missing');
      }
    });
  }

  checkAuthentication();
});