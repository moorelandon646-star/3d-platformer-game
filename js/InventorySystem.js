class InventoryItem {
  constructor(id, name, quantity = 1, type = 'item') {
    this.id = id;
    this.name = name;
    this.quantity = quantity;
    this.type = type; // 'weapon', 'ammo', 'consumable', 'item'
    this.icon = this.getIcon();
  }
  
  getIcon() {
    const icons = {
      'Pistol': '🔫',
      'Assault Rifle': '🔫',
      'Shotgun': '🔫',
      'Sniper Rifle': '🔫',
      'Ammo': '🟡',
      'Health Pack': '💊',
      'Shield': '🛡️'
    };
    return icons[this.name] || '📦';
  }
  
  add(quantity = 1) {
    this.quantity += quantity;
  }
  
  remove(quantity = 1) {
    this.quantity = Math.max(0, this.quantity - quantity);
    return this.quantity === 0;
  }
}

class InventorySystem {
  constructor(maxSlots = 20) {
    this.items = [];
    this.maxSlots = maxSlots;
    this.selectedItemIndex = 0;
    this.weight = 0;
    this.maxWeight = 100;
  }
  
  addItem(item, quantity = 1) {
    // Check if item already exists
    const existingItem = this.items.find(i => i.id === item.id);
    
    if (existingItem) {
      existingItem.add(quantity);
      return true;
    }
    
    // Add new item if space available
    if (this.items.length < this.maxSlots) {
      const newItem = new InventoryItem(item.id, item.name, quantity, item.type);
      this.items.push(newItem);
      return true;
    }
    
    return false; // Inventory full
  }
  
  removeItem(index, quantity = 1) {
    if (index < 0 || index >= this.items.length) return false;
    
    const item = this.items[index];
    const isEmpty = item.remove(quantity);
    
    if (isEmpty) {
      this.items.splice(index, 1);
      if (this.selectedItemIndex >= this.items.length && this.items.length > 0) {
        this.selectedItemIndex = this.items.length - 1;
      }
    }
    
    return true;
  }
  
  selectItem(index) {
    if (index >= 0 && index < this.items.length) {
      this.selectedItemIndex = index;
      return this.items[index];
    }
    return null;
  }
  
  getSelectedItem() {
    return this.items[this.selectedItemIndex] || null;
  }
  
  findItemByName(name) {
    return this.items.find(item => item.name === name);
  }
  
  getInventoryList() {
    return this.items.map((item, index) => ({
      index,
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      type: item.type,
      icon: item.icon,
      selected: index === this.selectedItemIndex
    }));
  }
  
  sortInventory() {
    this.items.sort((a, b) => {
      if (a.type !== b.type) {
        const typeOrder = { 'weapon': 0, 'ammo': 1, 'consumable': 2, 'item': 3 };
        return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      }
      return a.name.localeCompare(b.name);
    });
  }
  
  clear() {
    this.items = [];
    this.selectedItemIndex = 0;
  }
}