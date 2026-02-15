import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import type { Area, Village, Customer, FinanceEvent, DashboardData, CustomerLoanSummary, DateFilter } from './types';
import { AreaStorage, VillageStorage, CustomerStorage, EventStorage } from './storage';
import { calculateDashboard, getCustomerLoanSummary } from './calculations';

interface AppContextValue {
  areas: Area[];
  selectedAreaId: string | null;
  selectedArea: Area | null;
  villages: Village[];
  customers: Customer[];
  events: FinanceEvent[];
  dashboard: DashboardData;
  customerSummaries: CustomerLoanSummary[];
  loading: boolean;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  selectArea: (areaId: string) => void;
  createArea: (name: string, isOnboarding: boolean, openingBalance?: number) => Area;
  deleteArea: (id: string) => void;
  createVillage: (name: string) => Village;
  deleteVillage: (id: string) => void;
  createCustomer: (data: { villageId: string; villageName: string; name: string; phone: string }) => Customer;
  deleteCustomer: (id: string) => void;
  createNewLoan: (customerId: string, customerName: string, loanAmount: number, totalPayable: number, totalInstallments: number, paidInstallments?: number, paidAmount?: number) => void;
  renewLoan: (customerId: string, customerName: string, previousLoanEventId: string, loanAmount: number, totalPayable: number, totalInstallments: number) => void;
  makePayment: (customerId: string, customerName: string, loanEventId: string, onlineAmount: number, offlineAmount: number) => void;
  addExpense: (amount: number, description: string) => void;
  addCapital: (amount: number, description: string) => void;
  createAdjustment: (referenceEventId: string, amount: number, reason: string) => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [villages, setVillages] = useState<Village[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [events, setEvents] = useState<FinanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ mode: 'all' });

  const selectedArea = useMemo(() => areas.find(a => a.id === selectedAreaId) ?? null, [areas, selectedAreaId]);
  const dashboard = useMemo(() => calculateDashboard(events, dateFilter), [events, dateFilter]);

  const customerSummaries = useMemo(() => {
    return customers
      .map(c => getCustomerLoanSummary(c, events))
      .sort((a, b) => {
        if (a.isFullyPaid && !b.isFullyPaid) return 1;
        if (!a.isFullyPaid && b.isFullyPaid) return -1;
        if (a.paidToday && !b.paidToday) return 1;
        if (!a.paidToday && b.paidToday) return -1;
        return a.customer.serialNumber - b.customer.serialNumber;
      });
  }, [customers, events]);

  const loadData = useCallback((areaId?: string | null) => {
    const aid = areaId ?? selectedAreaId;
    if (!aid) return;
    setVillages(VillageStorage.getByArea(aid));
    setCustomers(CustomerStorage.getByArea(aid));
    setEvents(EventStorage.getByArea(aid));
  }, [selectedAreaId]);

  const refreshData = useCallback(() => {
    setAreas(AreaStorage.getAll());
    if (selectedAreaId) loadData(selectedAreaId);
  }, [selectedAreaId, loadData]);

  useEffect(() => {
    const allAreas = AreaStorage.getAll();
    setAreas(allAreas);
    const savedArea = AreaStorage.getSelected();
    if (savedArea && allAreas.some(a => a.id === savedArea)) {
      setSelectedAreaId(savedArea);
    } else if (allAreas.length > 0) {
      setSelectedAreaId(allAreas[0].id);
      AreaStorage.setSelected(allAreas[0].id);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedAreaId) loadData(selectedAreaId);
  }, [selectedAreaId, loadData]);

  const selectArea = useCallback((areaId: string) => {
    setSelectedAreaId(areaId);
    AreaStorage.setSelected(areaId);
  }, []);

  const createArea = useCallback((name: string, isOnboarding: boolean, openingBalance?: number) => {
    const area = AreaStorage.create(name, isOnboarding);
    if (isOnboarding && openingBalance && openingBalance > 0) {
      EventStorage.create(area.id, 'ONBOARDING_BALANCE', { amount: openingBalance });
    }
    setAreas(AreaStorage.getAll());
    if (!selectedAreaId) {
      setSelectedAreaId(area.id);
      AreaStorage.setSelected(area.id);
    }
    return area;
  }, [selectedAreaId]);

  const deleteArea = useCallback((id: string) => {
    AreaStorage.delete(id);
    const allAreas = AreaStorage.getAll();
    setAreas(allAreas);
    if (selectedAreaId === id) {
      const newSelected = allAreas[0]?.id ?? null;
      setSelectedAreaId(newSelected);
      if (newSelected) AreaStorage.setSelected(newSelected);
    }
  }, [selectedAreaId]);

  const createVillage = useCallback((name: string) => {
    if (!selectedAreaId) throw new Error('No area selected');
    const village = VillageStorage.create(selectedAreaId, name);
    loadData();
    return village;
  }, [selectedAreaId, loadData]);

  const deleteVillage = useCallback((id: string) => {
    VillageStorage.delete(id);
    loadData();
  }, [loadData]);

  const createCustomer = useCallback((data: { villageId: string; villageName: string; name: string; phone: string }) => {
    if (!selectedAreaId) throw new Error('No area selected');
    const serialNumber = VillageStorage.incrementSerial(data.villageId);
    const customer = CustomerStorage.create({
      areaId: selectedAreaId, villageId: data.villageId, villageName: data.villageName,
      name: data.name, phone: data.phone, serialNumber,
    });
    loadData();
    return customer;
  }, [selectedAreaId, loadData]);

  const deleteCustomer = useCallback((id: string) => {
    CustomerStorage.delete(id);
    loadData();
  }, [loadData]);

  const createNewLoan = useCallback((customerId: string, customerName: string, loanAmount: number, totalPayable: number, totalInstallments: number, paidInstallments?: number, paidAmount?: number) => {
    if (!selectedAreaId) throw new Error('No area selected');
    const loanEvent = EventStorage.create(selectedAreaId, 'NEW_LOAN', { customerId, customerName, loanAmount, totalPayable, totalInstallments });
    if (paidInstallments && paidAmount && paidAmount > 0) {
      const perInstallment = paidAmount / paidInstallments;
      for (let i = 0; i < paidInstallments; i++) {
        EventStorage.create(selectedAreaId, 'INSTALLMENT_PAYMENT', { customerId, customerName, loanEventId: loanEvent.eventId, onlineAmount: 0, offlineAmount: perInstallment, totalAmount: perInstallment, isOnboarding: true });
      }
    }
    loadData();
  }, [selectedAreaId, loadData]);

  const renewLoan = useCallback((customerId: string, customerName: string, previousLoanEventId: string, loanAmount: number, totalPayable: number, totalInstallments: number) => {
    if (!selectedAreaId) throw new Error('No area selected');
    EventStorage.create(selectedAreaId, 'RENEW_LOAN', { customerId, customerName, loanAmount, totalPayable, totalInstallments, previousLoanEventId });
    loadData();
  }, [selectedAreaId, loadData]);

  const makePayment = useCallback((customerId: string, customerName: string, loanEventId: string, onlineAmount: number, offlineAmount: number) => {
    if (!selectedAreaId) throw new Error('No area selected');
    EventStorage.create(selectedAreaId, 'INSTALLMENT_PAYMENT', { customerId, customerName, loanEventId, onlineAmount, offlineAmount, totalAmount: onlineAmount + offlineAmount });
    loadData();
  }, [selectedAreaId, loadData]);

  const addExpense = useCallback((amount: number, description: string) => {
    if (!selectedAreaId) throw new Error('No area selected');
    EventStorage.create(selectedAreaId, 'EXPENSE', { amount, description });
    loadData();
  }, [selectedAreaId, loadData]);

  const addCapital = useCallback((amount: number, description: string) => {
    if (!selectedAreaId) throw new Error('No area selected');
    EventStorage.create(selectedAreaId, 'CAPITAL_ADDED', { amount, description });
    loadData();
  }, [selectedAreaId, loadData]);

  const createAdjustment = useCallback((referenceEventId: string, amount: number, reason: string) => {
    if (!selectedAreaId) throw new Error('No area selected');
    EventStorage.create(selectedAreaId, 'ADJUSTMENT_EVENT', { referenceEventId, amount, reason });
    loadData();
  }, [selectedAreaId, loadData]);

  const value = useMemo(() => ({
    areas, selectedAreaId, selectedArea, villages, customers, events, dashboard, customerSummaries, loading,
    dateFilter, setDateFilter, selectArea, createArea, deleteArea, createVillage, deleteVillage, createCustomer,
    deleteCustomer, createNewLoan, renewLoan, makePayment, addExpense, addCapital, createAdjustment, refreshData,
  }), [areas, selectedAreaId, selectedArea, villages, customers, events, dashboard, customerSummaries, loading,
    dateFilter, selectArea, createArea, deleteArea, createVillage, deleteVillage, createCustomer, deleteCustomer,
    createNewLoan, renewLoan, makePayment, addExpense, addCapital, createAdjustment, refreshData]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
