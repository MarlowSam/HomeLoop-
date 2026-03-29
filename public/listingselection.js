// listingselection.js - Selection mode for editing/deleting listings
// Depends on: editlisting.js, editbundle.js, listings.js

let selectionModeActive = false;
let selectedProperty = null;
let selectedCard = null;
let activeSection = null;

// ==========================================
// ACTIVATE SELECTION MODE
// ==========================================
function activateSelectionMode(sectionType) {
  selectionModeActive = true;
  selectedProperty = null;
  selectedCard = null;
  activeSection = sectionType;

  // Change Edit Listings button to Cancel
  const btn = document.querySelector(`.edit-listings-btn[data-section="${sectionType}"]`);
  if (btn) {
    btn.textContent = 'Cancel';
    btn.style.color = '#ff4444';
  }

  // Get correct container based on section
  const allSections = document.querySelectorAll('#listings .agent-properties');
  let container = null;

  if (sectionType === 'featured') {
    container = allSections[0]?.querySelector('.house-cards');
  } else {
    container = allSections[1]?.querySelector('.house-cards');
  }

  if (!container) return;

  // Add circles to all cards in this section
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
  e.stopImmediatePropagation();

  const card = e.currentTarget;
  const property = card._selectionProperty;
  if (!property) return;

  // Deselect previous card
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

  // Show action menu like long press
  const isBundle = property._isBundleRepresentative === true;
  const hasInquiry = property._bundleHasInquiry || property._hasInquiry;

  const rect = card.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top;

  if (isBundle) {
    showBundleActionMenu(property, x, y);
  } else {
    showPropertyActionMenu(property, hasInquiry, x, y);
  }
}

// ==========================================
// EXPOSE GLOBALLY
// ==========================================
window.activateSelectionMode = activateSelectionMode;
window.deactivateSelectionMode = deactivateSelectionMode;

console.log('✅ listingselection.js loaded');

// ==========================================
// WIRE UP EDIT LISTINGS BUTTONS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.edit-listings-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const section = btn.dataset.section;
      if (btn.textContent.trim() === 'Cancel') {
        deactivateSelectionMode();
      } else {
        activateSelectionMode(section);
      }
    });
  });
});