// listingselection.js - Selection mode for editing/deleting listings
// Depends on: editlisting.js, editbundle.js, listings.js

let selectionModeActive = false;
let selectedProperty = null;
let selectedCard = null;
let actionBar = null;
let activeSection = null;

// ==========================================
// ACTIVATE SELECTION MODE
// ==========================================
function activateSelectionMode(sectionType) {
  selectionModeActive = true;
  selectedProperty = null;
  selectedCard = null;
  activeSection = sectionType;

  // Change Edit Listings button to Cancel for this section
  const btn = document.querySelector(`.edit-listings-btn[data-section="${sectionType}"]`);
  if (btn) {
    btn.textContent = 'Cancel';
    btn.style.color = '#ff4444';
  }

  // Add circles to cards in this section only
  const container = sectionType === 'featured'
    ? document.querySelector('#listings .agent-properties:first-of-type .house-cards')
    : document.querySelector('#listings .agent-properties:last-of-type .house-cards');

  if (!container) return;

  const cards = container.querySelectorAll('.card');
  cards.forEach(card => {
    card.querySelector('.selection-circle')?.remove();

    const circle = document.createElement('div');
    circle.className = 'selection-circle';
    circle.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.9);
      background: rgba(0, 0, 0, 0.35);
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      backdrop-filter: blur(4px);
      pointer-events: none;
    `;
    card.appendChild(circle);
    card.addEventListener('click', handleCardSelectionClick);
  });

  // Show empty action bar
  showActionBar();
}

// ==========================================
// DEACTIVATE SELECTION MODE
// ==========================================
function deactivateSelectionMode() {
  selectionModeActive = false;

  // Restore Edit Listings button
  const btn = document.querySelector(`.edit-listings-btn[data-section="${activeSection}"]`);
  if (btn) {
    btn.textContent = 'Edit Listings';
    btn.style.color = '#ff69ff';
  }

  // Deselect current card
  if (selectedCard) {
    selectedCard.style.outline = 'none';
    selectedCard.style.boxShadow = '';
  }

  // Remove all circles
  document.querySelectorAll('.selection-circle').forEach(c => c.remove());

  // Remove click overrides
  document.querySelectorAll('#listings .card').forEach(card => {
    card.removeEventListener('click', handleCardSelectionClick);
  });

  // Hide action bar
  hideActionBar();

  selectedProperty = null;
  selectedCard = null;
  activeSection = null;
}

// ==========================================
// HANDLE CARD CLICK IN SELECTION MODE
// ==========================================
function handleCardSelectionClick(e) {
  if (!selectionModeActive) return;
  e.preventDefault();
  e.stopPropagation();

  const card = e.currentTarget;
  const property = card._selectionProperty;
  if (!property) return;

  // Deselect previous
  if (selectedCard && selectedCard !== card) {
    selectedCard.style.outline = 'none';
    selectedCard.style.boxShadow = '';
    const prevCircle = selectedCard.querySelector('.selection-circle');
    if (prevCircle) {
      prevCircle.style.background = 'rgba(0, 0, 0, 0.35)';
      prevCircle.style.borderColor = 'rgba(255, 255, 255, 0.9)';
      prevCircle.innerHTML = '';
    }
  }

  // Select this card
  selectedCard = card;
  selectedProperty = property;

  card.style.outline = '2px solid #ff69ff';
  card.style.boxShadow = '0 0 15px rgba(255, 105, 255, 0.4)';

  const circle = card.querySelector('.selection-circle');
  if (circle) {
    circle.style.background = '#ff69ff';
    circle.style.borderColor = '#ff69ff';
    circle.innerHTML = '<i class="fas fa-check" style="color:white;font-size:0.7rem;"></i>';
  }

  updateActionBar(property);
}

// ==========================================
// ACTION BAR
// ==========================================
function showActionBar() {
  hideActionBar();

  actionBar = document.createElement('div');
  actionBar.id = 'listingActionBar';
  actionBar.style.cssText = `
    position: fixed;
    bottom: -120px;
    left: 0; right: 0;
    background: #2d0036;
    border-top: 2px solid rgba(255, 77, 210, 0.4);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    z-index: 9999;
    box-shadow: 0 -4px 20px rgba(255, 77, 210, 0.3);
    transition: bottom 0.3s ease;
  `;

  actionBar.innerHTML = `
    <p id="actionBarHint" style="color:rgba(255,255,255,0.6);font-size:0.9rem;margin:0;">
      Tap a property to select it
    </p>
    <button id="actionEditBtn" style="display:none;padding:10px 24px;
      background:linear-gradient(135deg,#ff69ff,#8a2be2);color:white;border:none;
      border-radius:8px;font-size:0.95rem;font-weight:600;cursor:pointer;
      display:none;align-items:center;gap:8px;">
      <i class="fas fa-edit"></i> Edit
    </button>
    <button id="actionDeleteBtn" style="display:none;padding:10px 24px;
      background:linear-gradient(135deg,#ff4444,#cc0000);color:white;border:none;
      border-radius:8px;font-size:0.95rem;font-weight:600;cursor:pointer;
      display:none;align-items:center;gap:8px;">
      <i class="fas fa-trash"></i> Delete
    </button>
    <button id="actionCancelBtn" style="padding:10px 24px;
      background:rgba(255,255,255,0.1);color:white;
      border:1px solid rgba(255,255,255,0.2);
      border-radius:8px;font-size:0.95rem;font-weight:600;cursor:pointer;
      display:flex;align-items:center;gap:8px;">
      <i class="fas fa-times"></i> Cancel
    </button>
  `;

  document.body.appendChild(actionBar);

  // Slide up
  requestAnimationFrame(() => {
    setTimeout(() => { actionBar.style.bottom = '0'; }, 10);
  });

  // Cancel button
  document.getElementById('actionCancelBtn').addEventListener('click', () => {
    deactivateSelectionMode();
  });
}

function updateActionBar(property) {
  if (!actionBar) return;

  const hint = document.getElementById('actionBarHint');
  const editBtn = document.getElementById('actionEditBtn');
  const deleteBtn = document.getElementById('actionDeleteBtn');

  if (hint) hint.style.display = 'none';

  const isBundle = property._isBundleRepresentative === true;
  const hasInquiry = property._bundleHasInquiry || property._hasInquiry;

  // Edit button — always show
  if (editBtn) {
    editBtn.style.display = 'flex';
    editBtn.onclick = () => {
      deactivateSelectionMode();
      if (isBundle) {
        window.openEditBundleForm(property);
      } else {
        openEditPropertyForm(property);
      }
    };
  }

  // Delete button — only show if no inquiry
  if (deleteBtn) {
    if (!hasInquiry) {
      deleteBtn.style.display = 'flex';
      deleteBtn.onclick = () => {
        deactivateSelectionMode();
        confirmDeleteProperty(property);
      };
    } else {
      deleteBtn.style.display = 'none';
    }
  }
}

function hideActionBar() {
  if (actionBar) {
    actionBar.style.bottom = '-120px';
    setTimeout(() => {
      actionBar?.remove();
      actionBar = null;
    }, 300);
  }
}

// ==========================================
// EXPOSE GLOBALLY
// ==========================================
window.activateSelectionMode = activateSelectionMode;
window.deactivateSelectionMode = deactivateSelectionMode;

console.log('✅ listingselection.js loaded');