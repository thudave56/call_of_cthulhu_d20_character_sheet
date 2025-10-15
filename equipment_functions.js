/**
 * ============================================================================
 * EQUIPMENT & COMBAT SYSTEM - ENHANCED UI
 * ============================================================================
 */

// Equipment arrays to store weapons and general items (global scope)
var weapons = [];
var equipment = [];

// Armor and shield presets
const armorPresets = {
  none: { name: "", bonus: 0, maxDex: 99, checkPenalty: 0, weight: 0 },
  leather: { name: "Leather Jacket", bonus: 1, maxDex: 6, checkPenalty: 0, weight: 4 },
  kevlar: { name: "Kevlar Vest", bonus: 3, maxDex: 4, checkPenalty: -2, weight: 8 },
  riot: { name: "Riot Gear", bonus: 5, maxDex: 2, checkPenalty: -4, weight: 25 }
};

const shieldPresets = {
  none: { name: "", bonus: 0, checkPenalty: 0, weight: 0 },
  small: { name: "Small Shield", bonus: 1, checkPenalty: -1, weight: 6 },
  large: { name: "Large Shield", bonus: 2, checkPenalty: -2, weight: 15 },
  riot: { name: "Riot Shield", bonus: 3, checkPenalty: -2, weight: 10 }
};

/**
 * Add a new weapon to the character
 */
function addWeapon() {
  const weapon = {
    id: Date.now(),
    name: "",
    type: "melee", // melee or ranged
    damage: "1d6",
    critical: "20/×2",
    range: "",
    weight: 0
  };
  weapons.push(weapon);
  renderWeapons();
  updateEncumbrance();
}

/**
 * Remove a weapon by ID
 */
function removeWeapon(id) {
  weapons = weapons.filter(w => w.id !== id);
  renderWeapons();
  updateEncumbrance();
}

/**
 * Render weapons as cards instead of table
 */
function renderWeapons() {
  const container = document.getElementById("weaponsGrid");
  const noWeaponsMsg = document.getElementById("noWeaponsMessage");
  
  container.innerHTML = "";

  if (weapons.length === 0) {
    noWeaponsMsg.style.display = "block";
    return;
  }

  noWeaponsMsg.style.display = "none";

  weapons.forEach(weapon => {
    const weaponCard = document.createElement("div");
    weaponCard.className = "weapon-card";

    // Calculate attack bonus
    const baseAttackText = document.getElementById("baseAttack")?.textContent || "+0";
    const baseAttack = parseInt(baseAttackText.replace(/[^0-9-]/g, "")) || 0;
    const strMod = abilityMods.Str || 0;
    const dexMod = abilityMods.Dex || 0;
    const attackBonus = weapon.type === "melee" ? (baseAttack + strMod) : (baseAttack + dexMod);
    const attackBonusStr = attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`;
    const abilityBonusStr = weapon.type === "melee" ? 
      (strMod >= 0 ? `+${strMod}` : `${strMod}`) : 
      (dexMod >= 0 ? `+${dexMod}` : `${dexMod}`);

    weaponCard.innerHTML = `
      <div class="weapon-header">
        <input type="text" class="weapon-name" value="${weapon.name}" 
               data-id="${weapon.id}" data-field="name" placeholder="Weapon name" />
        <select class="weapon-type" data-id="${weapon.id}" data-field="type">
          <option value="melee" ${weapon.type === "melee" ? "selected" : ""}>Melee</option>
          <option value="ranged" ${weapon.type === "ranged" ? "selected" : ""}>Ranged</option>
        </select>
        <button type="button" class="delete-weapon" onclick="removeWeapon(${weapon.id})">×</button>
      </div>
      <div class="weapon-stats">
        <div class="stat-group">
          <label>Attack</label>
          <div class="big-stat">${attackBonusStr}</div>
          <small>BAB ${baseAttack >= 0 ? '+' + baseAttack : baseAttack}, ${weapon.type === 'melee' ? 'Str' : 'Dex'} ${abilityBonusStr}</small>
        </div>
        <div class="stat-group">
          <label>Damage</label>
          <input type="text" value="${weapon.damage}" data-id="${weapon.id}" data-field="damage" placeholder="1d6" />
        </div>
        <div class="stat-group">
          <label>Critical</label>
          <input type="text" value="${weapon.critical}" data-id="${weapon.id}" data-field="critical" placeholder="20/×2" />
        </div>
        <div class="stat-group">
          <label>Range</label>
          <input type="text" value="${weapon.range}" data-id="${weapon.id}" data-field="range" placeholder="30 ft." />
        </div>
        <div class="stat-group">
          <label>Weight</label>
          <input type="number" value="${weapon.weight}" data-id="${weapon.id}" data-field="weight" 
                 min="0" step="0.1" placeholder="0" />
        </div>
      </div>
    `;

    container.appendChild(weaponCard);
  });

  // Add event listeners for weapon inputs
  document.querySelectorAll(".weapon-card input, .weapon-card select").forEach(input => {
    input.addEventListener("change", function() {
      const id = parseInt(this.dataset.id);
      const field = this.dataset.field;
      const weapon = weapons.find(w => w.id === id);
      if (weapon) {
        weapon[field] = field === "weight" ? parseFloat(this.value) || 0 : this.value;
        if (field === "type") {
          renderWeapons(); // Re-render to update attack bonus
        }
        if (field === "weight") {
          updateEncumbrance();
        }
      }
    });
  });
}

/**
 * Add a new equipment item
 */
function addEquipmentItem() {
  const item = {
    id: Date.now(),
    name: "",
    quantity: 1,
    weight: 0,
    notes: ""
  };
  equipment.push(item);
  renderEquipment();
  updateEncumbrance();
}

/**
 * Quick add equipment from input field
 */
function quickAddEquipment() {
  const input = document.getElementById("quickAddInput");
  const itemName = input.value.trim();
  
  if (!itemName) return;
  
  const item = {
    id: Date.now(),
    name: itemName,
    quantity: 1,
    weight: 0,
    notes: ""
  };
  
  equipment.push(item);
  input.value = "";
  renderEquipment();
  updateEncumbrance();
}

/**
 * Remove an equipment item by ID
 */
function removeEquipmentItem(id) {
  equipment = equipment.filter(e => e.id !== id);
  renderEquipment();
  updateEncumbrance();
}

/**
 * Render equipment as a list instead of table
 */
function renderEquipment() {
  const container = document.getElementById("equipmentList");
  const noEquipmentMsg = document.getElementById("noEquipmentMessage");
  
  container.innerHTML = "";

  if (equipment.length === 0) {
    noEquipmentMsg.style.display = "block";
    return;
  }

  noEquipmentMsg.style.display = "none";

  equipment.forEach(item => {
    const equipmentItem = document.createElement("div");
    equipmentItem.className = "equipment-item";

    const totalWeight = (item.quantity || 1) * (item.weight || 0);
    const weightDisplay = totalWeight > 0 ? `${totalWeight} lbs` : "—";

    equipmentItem.innerHTML = `
      <div class="item-main">
        <input type="text" class="item-name" value="${item.name}" 
               data-id="${item.id}" data-field="name" placeholder="Item name" />
        <span class="item-weight">${weightDisplay}</span>
      </div>
      <div class="item-controls">
        <input type="number" class="quantity-input" value="${item.quantity}" 
               data-id="${item.id}" data-field="quantity" min="1" />
        <button type="button" class="item-options" onclick="showItemOptions(${item.id})">⋯</button>
      </div>
    `;

    container.appendChild(equipmentItem);
  });

  // Add event listeners for equipment inputs
  document.querySelectorAll(".equipment-item input").forEach(input => {
    input.addEventListener("change", function() {
      const id = parseInt(this.dataset.id);
      const field = this.dataset.field;
      const item = equipment.find(e => e.id === id);
      if (item) {
        if (field === "quantity") {
          item[field] = parseInt(this.value) || 1;
          renderEquipment(); // Re-render to update weight display
          updateEncumbrance();
        } else {
          item[field] = this.value;
        }
      }
    });
  });
}

/**
 * Show item options (weight, notes, delete)
 */
function showItemOptions(id) {
  const item = equipment.find(e => e.id === id);
  if (!item) return;

  const weight = prompt(`Set weight per item (lbs):`, item.weight || 0);
  if (weight !== null) {
    item.weight = parseFloat(weight) || 0;
    renderEquipment();
    updateEncumbrance();
  }
}

/**
 * Apply armor preset
 */
function applyArmorPreset(presetKey) {
  const preset = armorPresets[presetKey];
  if (!preset) return;

  document.getElementById("armorName").value = preset.name;
  document.getElementById("armorBonus").value = preset.bonus;
  document.getElementById("armorMaxDex").value = preset.maxDex;
  document.getElementById("armorCheckPenalty").value = preset.checkPenalty;
  document.getElementById("armorWeight").value = preset.weight;

  updateArmorClass();
  updateEncumbrance();
}

/**
 * Apply shield preset
 */
function applyShieldPreset(presetKey) {
  const preset = shieldPresets[presetKey];
  if (!preset) return;

  document.getElementById("shieldName").value = preset.name;
  document.getElementById("shieldBonus").value = preset.bonus;
  document.getElementById("shieldCheckPenalty").value = preset.checkPenalty;
  document.getElementById("shieldWeight").value = preset.weight;

  updateArmorClass();
  updateEncumbrance();
}

/**
 * Toggle armor/shield details visibility
 */
function toggleDetails(elementId) {
  const details = document.getElementById(elementId);
  const isActive = details.classList.contains("active");
  
  if (isActive) {
    details.classList.remove("active");
  } else {
    details.classList.add("active");
  }
}

/**
 * Calculate and update Armor Class
 */
function updateArmorClass() {
  const armorBonus = parseInt(document.getElementById("armorBonus").value) || 0;
  const shieldBonus = parseInt(document.getElementById("shieldBonus").value) || 0;
  const armorMaxDex = parseInt(document.getElementById("armorMaxDex").value) || 99;
  const dexMod = abilityMods.Dex || 0;

  // Cap Dex modifier by armor's max Dex bonus
  const effectiveDexMod = Math.min(dexMod, armorMaxDex);

  // AC = 10 + armor + shield + Dex (capped)
  const ac = 10 + armorBonus + shieldBonus + effectiveDexMod;

  document.getElementById("acValue").textContent = ac;

  // Update breakdown
  const breakdown = [];
  breakdown.push("Base: 10");
  if (armorBonus > 0) breakdown.push(`Armor: +${armorBonus}`);
  if (shieldBonus > 0) breakdown.push(`Shield: +${shieldBonus}`);
  if (effectiveDexMod !== 0) {
    const dexStr = effectiveDexMod >= 0 ? `+${effectiveDexMod}` : `${effectiveDexMod}`;
    breakdown.push(`Dex: ${dexStr}${dexMod > armorMaxDex ? ` (capped)` : ""}`);
  }
  document.getElementById("acBreakdown").textContent = breakdown.join(", ");
}

/**
 * Update initiative display
 */
function updateInitiative() {
  const dexMod = abilityMods.Dex || 0;
  const initStr = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
  document.getElementById("initValue").textContent = initStr;
}

/**
 * Calculate total weight and encumbrance with enhanced display
 */
function updateEncumbrance() {
  // Calculate total weight
  let totalWeight = 0;

  // Add weapon weights
  weapons.forEach(weapon => {
    totalWeight += parseFloat(weapon.weight) || 0;
  });

  // Add equipment weights (quantity × weight)
  equipment.forEach(item => {
    totalWeight += (parseFloat(item.quantity) || 0) * (parseFloat(item.weight) || 0);
  });

  // Add armor weight
  totalWeight += parseFloat(document.getElementById("armorWeight").value) || 0;
  totalWeight += parseFloat(document.getElementById("shieldWeight").value) || 0;

  // Round to 1 decimal place
  totalWeight = Math.round(totalWeight * 10) / 10;

  document.getElementById("totalWeight").textContent = totalWeight;

  // Calculate encumbrance thresholds based on Strength
  const strInput = document.querySelector('[data-ability="Str"]');
  const strScore = strInput ? (parseInt(strInput.value) || 10) : 10;
  const lightLoad = strScore * 3;
  const mediumLoad = strScore * 6;
  const heavyLoad = strScore * 10;
  const maxLoad = strScore * 15;

  // Update weight limit display
  document.getElementById("weightLimit").textContent = `(max ${maxLoad} lbs)`;

  // Update weight bar
  const weightProgress = document.getElementById("weightProgress");
  const progressPercent = Math.min((totalWeight / maxLoad) * 100, 100);
  weightProgress.style.width = `${progressPercent}%`;

  // Update threshold markers
  const lightPercent = (lightLoad / maxLoad) * 100;
  const mediumPercent = (mediumLoad / maxLoad) * 100;
  const heavyPercent = (heavyLoad / maxLoad) * 100;

  // Determine encumbrance status
  let status, statusClass, effects;
  if (totalWeight <= lightLoad) {
    status = "Light Load";
    statusClass = "light";
    effects = "No movement or skill penalties";
  } else if (totalWeight <= mediumLoad) {
    status = "Medium Load";
    statusClass = "medium";
    effects = "Max Dex +3, -3 check penalty";
  } else if (totalWeight <= heavyLoad) {
    status = "Heavy Load";
    statusClass = "heavy";
    effects = "Max Dex +1, -6 check penalty, ×3 run speed";
  } else if (totalWeight <= maxLoad) {
    status = "Overloaded";
    statusClass = "overloaded";
    effects = "Can only move 5 ft./round";
  } else {
    status = "Cannot Move";
    statusClass = "overloaded";
    effects = "Exceeds maximum load capacity";
  }

  const statusElement = document.getElementById("encumbranceStatus");
  statusElement.textContent = status;
  statusElement.className = `weight-status ${statusClass}`;

  document.getElementById("encumbranceEffects").innerHTML = `<small>${effects}</small>`;

  // Update speed based on encumbrance
  updateSpeedDisplay(statusClass);
}

/**
 * Update speed display based on encumbrance
 */
function updateSpeedDisplay(encumbranceClass) {
  const speedElement = document.getElementById("speedStatus");
  const baseSpeed = parseInt(document.getElementById("speed").value) || 30;
  
  let speedText;
  switch (encumbranceClass) {
    case "medium":
      speedText = `${baseSpeed} ft (Medium Load)`;
      break;
    case "heavy":
      speedText = `${baseSpeed} ft (Heavy Load)`;
      break;
    case "overloaded":
      speedText = "5 ft (Overloaded)";
      break;
    default:
      speedText = "Normal";
  }
  
  speedElement.textContent = speedText;
}

/**
 * Initialize equipment system with enhanced UI
 */
function initializeEquipmentSystem() {
  renderWeapons();
  renderEquipment();
  updateArmorClass();
  updateInitiative();
  updateEncumbrance();

  // Add event listeners for equipment buttons
  document.getElementById("addWeaponBtn").addEventListener("click", addWeapon);
  document.getElementById("addEquipmentBtn").addEventListener("click", addEquipmentItem);
  document.getElementById("quickAddBtn").addEventListener("click", quickAddEquipment);

  // Quick add on Enter key
  document.getElementById("quickAddInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      quickAddEquipment();
    }
  });

  // Armor preset handling
  document.getElementById("armorPreset").addEventListener("change", function() {
    if (this.value !== "custom") {
      applyArmorPreset(this.value);
      document.getElementById("armorDetails").classList.remove("active");
    } else {
      document.getElementById("armorDetails").classList.add("active");
    }
  });

  // Shield preset handling
  document.getElementById("shieldPreset").addEventListener("change", function() {
    if (this.value !== "custom") {
      applyShieldPreset(this.value);
      document.getElementById("shieldDetails").classList.remove("active");
    } else {
      document.getElementById("shieldDetails").classList.add("active");
    }
  });

  // Toggle details buttons
  document.getElementById("armorToggle").addEventListener("click", function() {
    toggleDetails("armorDetails");
  });

  document.getElementById("shieldToggle").addEventListener("click", function() {
    toggleDetails("shieldDetails");
  });

  // Add event listeners for armor/shield inputs
  ["armorBonus", "shieldBonus", "armorMaxDex", "armorName", "shieldName",
   "armorCheckPenalty", "shieldCheckPenalty", "armorWeight", "shieldWeight"].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("input", () => {
        updateArmorClass();
        updateEncumbrance();
      });
    }
  });

  // Speed input handling
  document.getElementById("speed").addEventListener("input", () => {
    updateEncumbrance(); // This will update speed display
  });

  // Update AC and initiative when abilities change
  document.querySelectorAll('[data-ability]').forEach(input => {
    input.addEventListener("input", () => {
      updateArmorClass();
      updateInitiative();
      updateEncumbrance();
      renderWeapons(); // Update weapon attack bonuses
    });
  });

  // Update weapons when base attack changes
  const levelInput = document.getElementById("level");
  const attackOption = document.getElementById("attackOption");
  if (levelInput) {
    levelInput.addEventListener("input", () => {
      setTimeout(renderWeapons, 50); // Delay to allow base attack to recalculate
    });
  }
  if (attackOption) {
    attackOption.addEventListener("change", () => {
      setTimeout(renderWeapons, 50);
    });
  }
}
