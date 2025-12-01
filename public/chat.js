// chat.js - Real-time Chat Client with Socket.io (FIXED)
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
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// ============================================
// GET TOKEN FROM API
// ============================================
async function getAuthToken() {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token retrieved from API');
      currentUserId = data.user.userId;
      return data.token;
    } else {
      console.error('❌ Failed to get token from API');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching token:', error);
    return null;
  }
}

// ============================================
// INITIALIZE SOCKET CONNECTION
// ============================================
async function initializeSocket() {
  if (socketConnectionPromise) {
    return socketConnectionPromise;
  }

  const token = await getAuthToken();
  
  console.log('🔍 Checking for token:', token ? 'Found' : 'Not found');
  
  if (!token) {
    console.error('❌ No authentication token found');
    showAlert('Please log in to use the chat feature.');
    return Promise.reject(new Error('No token'));
  }

  socketConnectionPromise = new Promise((resolve, reject) => {
    try {
      socket = io({
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      const connectionTimeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(connectionTimeout);
        console.log('✅ Connected to chat server');
        isSocketInitialized = true;
        resolve(true);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ Connection error:', error.message);
        socketConnectionPromise = null;
        reject(error);
      });

      socket.on('disconnect', () => {
        console.log('❌ Disconnected from chat server');
        isSocketInitialized = false;
        socketConnectionPromise = null;
      });

      socket.on('new_message', (message) => {
        console.log('📩 New message received:', message);
        displayMessage(message);
        
        const chatBody = document.getElementById('chatMessages');
        if (chatBody) {
          chatBody.scrollTop = chatBody.scrollHeight;
        }
      });

      socket.on('user_typing', (data) => {
        if (data.conversationId === currentConversationId) {
          showTypingIndicator();
        }
      });

      socket.on('user_stop_typing', (data) => {
        if (data.conversationId === currentConversationId) {
          hideTypingIndicator();
        }
      });

      socket.on('user_online', (data) => {
        if (data.conversationId === currentConversationId) {
          updateAgentOnlineStatus(true);
        }
      });

      socket.on('new_message_notification', (data) => {
        console.log('🔔 New message notification:', data);
        updateUnreadBadge();
      });

    } catch (error) {
      console.error('❌ Error initializing socket:', error);
      socketConnectionPromise = null;
      reject(error);
    }
  });

  return socketConnectionPromise;
}

// ============================================
// OPEN CHAT (from Chat Agent button)
// ============================================
async function openChat(propertyId, agentId) {
  console.log('🚀 Opening chat for property:', propertyId, 'agent:', agentId);
  
  currentPropertyId = propertyId;
  currentAgentId = agentId;

  try {
    if (!socket || !socket.connected) {
      console.log('⏳ Initializing socket connection...');
      await initializeSocket();
      console.log('✅ Socket connected successfully');
    }

    const response = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        property_id: propertyId,
        agent_id: agentId
      })
    });

    const data = await response.json();
    console.log('📝 Conversation response:', data);
    
    if (data.success && data.conversation) {
      currentConversationId = data.conversation.conversation_id;
      
      if (socket && socket.connected) {
        socket.emit('join_conversation', currentConversationId);
        console.log('✅ Joined conversation:', currentConversationId);
      }
      
      await loadMessages(currentConversationId);
      
      document.getElementById('chatPopup').style.display = 'flex';
      
      markMessagesAsRead(currentConversationId);
      
      document.getElementById('chatInput').focus();
    } else {
      throw new Error(data.message || 'Failed to create conversation');
    }
  } catch (error) {
    console.error('❌ Error opening chat:', error);
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
    const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
      method: 'GET',
      credentials: 'include'
    });

    const data = await response.json();
    console.log('📨 Messages loaded:', data);
    
    if (data.success && data.messages) {
      const chatBody = document.getElementById('chatMessages');
      
      const initialMessage = chatBody.querySelector('.agent-message');
      chatBody.innerHTML = '';
      if (initialMessage) {
        chatBody.appendChild(initialMessage);
      }
      
      data.messages.forEach(message => {
        displayMessage(message);
      });
      
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  } catch (error) {
    console.error(' Error loading messages:', error);
  }
}

// ============================================
// DISPLAY MESSAGE IN CHAT
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
    <div class="message-content">
      ${escapeHtml(message.message_text)}
    </div>
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
  
  if (!messageText || !currentConversationId) {
    return;
  }
  
  if (!socket || !socket.connected) {
    showAlert('Not connected to chat server. Please refresh and try again.');
    return;
  }
  
  socket.emit('send_message', {
    conversationId: currentConversationId,
    messageText: messageText
  });
  
  console.log('📤 Message sent:', messageText);
  
  input.value = '';
  
  if (socket && socket.connected) {
    socket.emit('stop_typing', {
      conversationId: currentConversationId
    });
  }
}

// ============================================
// TYPING INDICATOR
// ============================================
function handleTyping() {
  if (!currentConversationId || !socket || !socket.connected) return;
  
  socket.emit('typing', {
    conversationId: currentConversationId
  });
  
  clearTimeout(typingTimeout);
  
  typingTimeout = setTimeout(() => {
    if (socket && socket.connected) {
      socket.emit('stop_typing', {
        conversationId: currentConversationId
      });
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
    <div class="message-content">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
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
  if (!socket || !socket.connected) return;
  
  socket.emit('mark_as_read', {
    conversationId: conversationId
  });
  
  try {
    await fetch(`/api/chat/conversations/${conversationId}/read`, {
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
    const response = await fetch('/api/chat/unread-count', {
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

// ============================================
// UPDATE AGENT ONLINE STATUS
// ============================================
function updateAgentOnlineStatus(isOnline) {
  const statusIndicator = document.querySelector('.agent-online-status');
  if (statusIndicator) {
    if (isOnline) {
      statusIndicator.innerHTML = '🟢 Online';
      statusIndicator.style.display = 'inline-block';
    } else {
      statusIndicator.style.display = 'none';
    }
  }
}

// ============================================
// CLOSE CHAT
// ============================================
function closeChat() {
  document.getElementById('chatPopup').style.display = 'none';
  
  if (socket && socket.connected && currentConversationId) {
    socket.emit('leave_conversation', currentConversationId);
  }
  
  currentConversationId = null;
  currentPropertyId = null;
  currentAgentId = null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// CHECK AUTHENTICATION
// ============================================
async function checkAuthentication() {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      console.log('✅ User is authenticated');
      updateUnreadBadge();
      setInterval(updateUnreadBadge, 30000);
    } else {
      console.log('❌ User not authenticated');
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  
  console.log('🎬 Chat.js loaded');
  
  const closeBtn = document.getElementById('closeChat');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeChat);
  }
  
  const sendBtn = document.getElementById('sendMessage');
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }
  
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    chatInput.addEventListener('input', handleTyping);
  }
  
  const chatAgentBtn = document.getElementById('chatAgentBtn');
  if (chatAgentBtn) {
    chatAgentBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      console.log('💬 Chat Agent button clicked');
      
      const urlParams = new URLSearchParams(window.location.search);
      const propertyId = urlParams.get('id');
      const agentId = chatAgentBtn.dataset.agentId;
      
      console.log('🏠 Property ID:', propertyId);
      console.log('👨‍💼 Agent ID:', agentId);
      
      if (propertyId && agentId) {
        openChat(propertyId, agentId);
      } else {
        showAlert('Property or agent information missing');
      }
    });
  }
  
  const token = getCookie('token');
  console.log('🔐 Authentication status:', token ? 'Logged in' : 'Checking...');
  
  checkAuthentication();
});