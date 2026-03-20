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
// CUSTOM ALERT POPUP
// ============================================
function showAlert(message) {
  const existingAlert = document.querySelector('.custom-alert-overlay');
  if (existingAlert) existingAlert.remove();

  const overlay = document.createElement('div');
  overlay.className = 'custom-alert-overlay';
  overlay.innerHTML = `
    <div class="custom-alert-box">
      <p>${message}</p>
      <button class="custom-alert-btn">OK</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const btn = overlay.querySelector('.custom-alert-btn');
  btn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ============================================
// GET TOKEN FROM API
// ============================================
async function getAuthToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
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
    showAlert('Please log in to use the chat feature.');
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
        displayMessage(message);
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
  console.log('Opening chat for property:', propertyId, 'agent:', agentId);

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

      // Prevent background scroll when chat is open
      document.body.style.overflow = 'hidden';

      markMessagesAsRead(currentConversationId);

      // Focus input on desktop only to avoid keyboard jump on mobile
      if (window.innerWidth > 768) {
        document.getElementById('chatInput').focus();
      }

    } else {
      throw new Error(data.message || 'Failed to create conversation');
    }
  } catch (error) {
    console.error('Error opening chat:', error);
    if (error.message === 'No token') {
      showAlert('Please log in to use the chat feature.');
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
      method: 'GET',
      credentials: 'include'
    });
    const data = await response.json();

    if (data.success && data.messages) {
      const chatBody = document.getElementById('chatMessages');
      const initialMessage = chatBody.querySelector('.agent-message');
      chatBody.innerHTML = '';
      if (initialMessage) chatBody.appendChild(initialMessage);

      data.messages.forEach(message => displayMessage(message));
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  } catch (error) {
    console.error('Error loading messages:', error);
  }
}

// ============================================
// DISPLAY MESSAGE
// ============================================
function displayMessage(message) {
  const chatBody = document.getElementById('chatMessages');
  const isOwnMessage = message.sender_id === currentUserId;

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isOwnMessage ? 'user-message' : 'agent-message'}`;

  const timestamp = new Date(message.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  messageDiv.innerHTML = `
    <div class="message-content">${escapeHtml(message.message_text)}</div>
    <div class="message-time">${timestamp}</div>
  `;

  chatBody.appendChild(messageDiv);
}

// ============================================
// SEND MESSAGE
// ============================================
function sendMessage() {
  const input = document.getElementById('chatInput');
  const messageText = input.value.trim();

  if (!messageText || !currentConversationId) return;

  if (!socket || !socket.connected) {
    showAlert('Not connected to chat server. Please refresh and try again.');
    return;
  }

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
    if (socket && socket.connected) {
      socket.emit('stop_typing', { conversationId: currentConversationId });
    }
  }, 2000);
}

function showTypingIndicator() {
  const chatBody = document.getElementById('chatMessages');
  const existing = chatBody.querySelector('.typing-indicator');
  if (existing) existing.remove();
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message agent-message typing-indicator';
  typingDiv.innerHTML = `
    <div class="message-content typing-dots">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>
  `;
  chatBody.appendChild(typingDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function hideTypingIndicator() {
  const indicator = document.querySelector('.typing-indicator');
  if (indicator) indicator.remove();
}

// ============================================
// MARK MESSAGES AS READ
// ============================================
async function markMessagesAsRead(conversationId) {
  if (socket && socket.connected) {
    socket.emit('mark_as_read', { conversationId });
  }
  try {
    await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/read`, {
      method: 'PUT',
      credentials: 'include'
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
      method: 'GET',
      credentials: 'include'
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
  const statusIndicator = document.querySelector('.agent-online-status');
  if (statusIndicator) {
    statusIndicator.innerHTML = isOnline ? '🟢 Online' : '';
    statusIndicator.style.display = isOnline ? 'inline-block' : 'none';
  }
}

// ============================================
// CLOSE CHAT
// ============================================
function closeChat() {
  const chatPopup = document.getElementById('chatPopup');
  chatPopup.classList.remove('chat-visible');

  // Restore background scroll
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

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function checkAuthentication() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
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
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeChat());
  }

  const sendBtn = document.getElementById('sendMessage');
  if (sendBtn) sendBtn.addEventListener('click', sendMessage);

  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    chatInput.addEventListener('input', function () {
      handleTyping();
      autoResizeTextarea(this);
    });

    // Scroll to bottom when keyboard opens on mobile
    chatInput.addEventListener('focus', function () {
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