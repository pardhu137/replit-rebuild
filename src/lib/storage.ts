import type { Area, Village, Customer, FinanceEvent } from './types';

const KEYS = {
  AREAS: 'finance_areas',
  VILLAGES: 'finance_villages',
  CUSTOMERS: 'finance_customers',
  EVENTS: 'finance_events',
  SELECTED_AREA: 'finance_selected_area',
  DEVICE_ID: 'finance_device_id',
};

export function generateId(): string {
  return crypto.randomUUID();
}

function getDeviceId(): string {
  let deviceId = localStorage.getItem(KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = generateId();
    localStorage.setItem(KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

function getItems<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItems<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

export const AreaStorage = {
  getAll(): Area[] {
    return getItems<Area>(KEYS.AREAS);
  },

  create(name: string, isOnboarding: boolean): Area {
    const areas = this.getAll();
    const area: Area = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      isOnboarding,
    };
    areas.push(area);
    setItems(KEYS.AREAS, areas);
    return area;
  },

  delete(id: string): void {
    const areas = this.getAll();
    setItems(KEYS.AREAS, areas.filter(a => a.id !== id));
    const villages = VillageStorage.getByArea(id);
    for (const v of villages) {
      VillageStorage.delete(v.id);
    }
    const customers = CustomerStorage.getByArea(id);
    for (const c of customers) {
      CustomerStorage.delete(c.id);
    }
  },

  getSelected(): string | null {
    return localStorage.getItem(KEYS.SELECTED_AREA);
  },

  setSelected(areaId: string): void {
    localStorage.setItem(KEYS.SELECTED_AREA, areaId);
  },
};

export const VillageStorage = {
  getAll(): Village[] {
    return getItems<Village>(KEYS.VILLAGES);
  },

  getByArea(areaId: string): Village[] {
    return this.getAll().filter(v => v.areaId === areaId);
  },

  create(areaId: string, name: string): Village {
    const all = this.getAll();
    const village: Village = {
      id: generateId(),
      areaId,
      name,
      nextSerialNumber: 1,
      createdAt: new Date().toISOString(),
    };
    all.push(village);
    setItems(KEYS.VILLAGES, all);
    return village;
  },

  incrementSerial(villageId: string): number {
    const all = this.getAll();
    const village = all.find(v => v.id === villageId);
    if (!village) throw new Error('Village not found');
    const serial = village.nextSerialNumber;
    village.nextSerialNumber += 1;
    setItems(KEYS.VILLAGES, all);
    return serial;
  },

  delete(id: string): void {
    const all = this.getAll();
    setItems(KEYS.VILLAGES, all.filter(v => v.id !== id));
  },
};

export const CustomerStorage = {
  getAll(): Customer[] {
    return getItems<Customer>(KEYS.CUSTOMERS);
  },

  getByArea(areaId: string): Customer[] {
    return this.getAll().filter(c => c.areaId === areaId);
  },

  getById(id: string): Customer | undefined {
    return this.getAll().find(c => c.id === id);
  },

  create(data: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const all = this.getAll();
    const customer: Customer = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    all.push(customer);
    setItems(KEYS.CUSTOMERS, all);
    return customer;
  },

  delete(id: string): void {
    const all = this.getAll();
    setItems(KEYS.CUSTOMERS, all.filter(c => c.id !== id));
  },
};

export const EventStorage = {
  getAll(): FinanceEvent[] {
    return getItems<FinanceEvent>(KEYS.EVENTS);
  },

  getByArea(areaId: string): FinanceEvent[] {
    return this.getAll()
      .filter(e => e.areaId === areaId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  create(
    areaId: string,
    eventType: FinanceEvent['eventType'],
    payload: FinanceEvent['payload']
  ): FinanceEvent {
    const all = this.getAll();
    const deviceId = getDeviceId();
    const event: FinanceEvent = {
      eventId: generateId(),
      schemaVersion: 1,
      accountId: 'default',
      areaId,
      createdBy: 'owner',
      deviceId,
      createdAt: new Date().toISOString(),
      syncedAt: null,
      eventType,
      payload,
    };
    all.push(event);
    setItems(KEYS.EVENTS, all);
    return event;
  },

  getByCustomer(customerId: string): FinanceEvent[] {
    return this.getAll().filter(e => {
      const p = e.payload as Record<string, unknown>;
      return p.customerId === customerId;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
};
