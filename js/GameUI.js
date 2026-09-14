class GameUI {
  constructor() {
    this.createUIElements();
  }
  
  createUIElements() {
    // HUD Container
    this.hud = document.createElement('div');
    this.hud.id = 'hud';
    this.hud.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      font-family: 'Arial', sans-serif;
      color: #00ff00;
      text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
      pointer-events: none;
      font-size: 14px;
      z-index: 100;
    `;
    document.body.appendChild(this.hud);
    
    // Weapon Info (Top Right)
    this.weaponInfo = document.createElement('div');
    this.weaponInfo.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 20, 0, 0.8);
      padding: 15px;
      border: 2px solid #00ff00;
      border-radius: 5px;
      min-width: 200px;
    `;
    this.hud.appendChild(this.weaponInfo);
    
    // Crosshair (Center)
    this.crosshair = document.createElement('div');
    this.crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 30px;
      height: 30px;
      border: 2px solid #00ff00;
      border-radius: 50%;
      box-shadow: inset 0 0 10px #00ff00;
    `;
    
    // Crosshair dot
    const dot = document.createElement('div');
    dot.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 4px;
      height: 4px;
      background: #00ff00;
      border-radius: 50%;
    `;
    this.crosshair.appendChild(dot);
    this.hud.appendChild(this.crosshair);
    
    // Stats (Bottom Left)
    this.stats = document.createElement('div');
    this.stats.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 20, 0, 0.8);
      padding: 15px;
      border: 2px solid #00ff00;
      border-radius: 5px;
      min-width: 200px;
    `;
    this.hud.appendChild(this.stats);
    
    // Inventory (Bottom Right)
    this.inventoryDisplay = document.createElement('div');
    this.inventoryDisplay.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 20, 0, 0.8);
      padding: 15px;
      border: 2px solid #00ff00;
      border-radius: 5px;
      max-width: 300px;
    `;
    this.hud.appendChild(this.inventoryDisplay);
    
    // Controls (Top Left)
    this.controls = document.createElement('div');
    this.controls.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0, 20, 0, 0.8);
      padding: 15px;
      border: 2px solid #00ff00;
      border-radius: 5px;
      font-size: 12px;
    `;
    this.controls.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">⌨️ CONTROLS</div>
      <div>WASD - Move</div>
      <div>SPACE - Jump</div>
      <div>SHIFT - Sprint</div>
      <div>MOUSE - Look Around</div>
      <div>LMB - Fire</div>
      <div>R - Reload</div>
      <div>1-4 - Switch Weapon</div>
      <div>I - Toggle Inventory</div>
    `;
    this.hud.appendChild(this.controls);
    
    // Inventory Panel (Hidden by default)
    this.inventoryPanel = document.createElement('div');
    this.inventoryPanel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 30, 0, 0.95);
      padding: 30px;
      border: 3px solid #00ff00;
      border-radius: 10px;
      display: none;
      max-height: 80vh;
      overflow-y: auto;
      width: 500px;
      z-index: 200;
      box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
    `;
    this.inventoryPanel.innerHTML = '<h2 style="margin-top: 0; color: #00ff00;">INVENTORY</h2><div id="inventory-items"></div>';
    this.hud.appendChild(this.inventoryPanel);
  }
  
  updateWeaponInfo(gunStats) {
    const ammoBar = this.createAmmoBar(gunStats.ammoInMagazine, gunStats.ammoCapacity);
    this.weaponInfo.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${gunStats.name.toUpperCase()}</div>
      <div>Magazine: ${gunStats.ammoInMagazine} / ${gunStats.ammoCapacity}</div>
      <div>${ammoBar}</div>
      <div style="margin-top: 8px;">Total: ${gunStats.totalAmmo}</div>
      <div>Damage: ${gunStats.damage}</div>
      <div>Fire Rate: ${gunStats.fireRate}ms</div>
    `;
  }
  
  createAmmoBar(current, max) {
    const percentage = (current / max) * 100;
    const color = percentage > 50 ? '#00ff00' : percentage > 25 ? '#ffff00' : '#ff0000';
    return `
      <div style="
        background: #000;
        border: 1px solid ${color};
        height: 20px;
        position: relative;
        margin-top: 5px;
        border-radius: 3px;
        overflow: hidden;
      ">
        <div style="
          background: ${color};
          height: 100%;
          width: ${percentage}%;
          transition: width 0.2s;
        "></div>
      </div>
    `;
  }
  
  updateStats(fps, position) {
    this.stats.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">📊 STATS</div>
      <div>FPS: ${fps}</div>
      <div>Position: (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})</div>
      <div style="margin-top: 8px; font-size: 12px;">Health: <span style="color: #ff0000;">100/100</span></div>
    `;
  }
  
  updateInventory(items) {
    let inventoryHTML = '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">';
    
    for (let i = 0; i < Math.max(items.length, 10); i++) {
      const item = items[i];
      const isSelected = item && item.selected;
      
      inventoryHTML += `
        <div style="
          border: 2px solid ${isSelected ? '#ff00ff' : '#00ff00'};
          padding: 8px;
          text-align: center;
          background: ${isSelected ? 'rgba(255, 0, 255, 0.2)' : 'rgba(0, 50, 0, 0.5)'};
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        ">
          <div style="font-size: 20px; margin-bottom: 4px;">${item ? item.icon : '❌'}</div>
          <div>${item ? item.name : ''}</div>
          ${item ? `<div style="font-size: 10px; margin-top: 4px;">x${item.quantity}</div>` : ''}
        </div>
      `;
    }
    
    inventoryHTML += '</div>';
    document.getElementById('inventory-items').innerHTML = inventoryHTML;
  }
  
  toggleInventory() {
    if (this.inventoryPanel.style.display === 'none') {
      this.inventoryPanel.style.display = 'block';
    } else {
      this.inventoryPanel.style.display = 'none';
    }
  }
  
  showMessage(text, duration = 3000) {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 50, 0, 0.9);
      border: 2px solid #00ff00;
      padding: 20px 40px;
      border-radius: 10px;
      font-size: 18px;
      z-index: 300;
      box-shadow: 0 0 30px rgba(0, 255, 0, 0.8);
      color: #00ff00;
      text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
    `;
    message.textContent = text;
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, duration);
  }
}
