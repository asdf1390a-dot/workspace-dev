'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface TravelCost {
  id: string;
  travel_id: string;
  payer_id: string;
  title: string;
  amount: number;
  currency: 'INR' | 'USD' | 'EUR' | 'KRW';
  cost_type: string;
  cost_date: string;
  workflow_status?: 'request' | 'pending_approval' | 'approved' | 'reimbursed';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TravelMember {
  id: string;
  travel_id: string;
  user_id: string;
  name?: string;
  role: 'organizer' | 'companion' | 'guest';
  permission: 'read_only' | 'read_write';
}

export interface SettlementMember {
  member_id: string;
  user_id: string;
  total_paid: number;
  share: number;
  balance: number;
}

interface TravelContextType {
  travelId: string;
  costs: TravelCost[];
  members: TravelMember[];
  settlement: SettlementMember[];
  currentUserId?: string;
  setCosts: (costs: TravelCost[]) => void;
  setMembers: (members: TravelMember[]) => void;
  setSettlement: (settlement: SettlementMember[]) => void;
  setCurrentUserId: (userId: string) => void;
  updateCostStatus: (costId: string, status: string, approvedBy?: string) => void;
  addCost: (cost: TravelCost) => void;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export function TravelProvider({
  children,
  travelId
}: {
  children: ReactNode;
  travelId: string;
}) {
  const [costs, setCosts] = useState<TravelCost[]>([]);
  const [members, setMembers] = useState<TravelMember[]>([]);
  const [settlement, setSettlement] = useState<SettlementMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>();

  const updateCostStatus = (costId: string, status: string, approvedBy?: string) => {
    setCosts(costs.map(cost =>
      cost.id === costId
        ? {
            ...cost,
            workflow_status: status as any,
            approved_by: approvedBy,
            approved_at: status === 'approved' ? new Date().toISOString() : undefined
          }
        : cost
    ));
  };

  const addCost = (cost: TravelCost) => {
    setCosts([...costs, cost]);
  };

  return (
    <TravelContext.Provider
      value={{
        travelId,
        costs,
        members,
        settlement,
        currentUserId,
        setCosts,
        setMembers,
        setSettlement,
        setCurrentUserId,
        updateCostStatus,
        addCost,
      }}
    >
      {children}
    </TravelContext.Provider>
  );
}

export function useTravelContext() {
  const context = useContext(TravelContext);
  if (!context) {
    throw new Error('useTravelContext must be used within TravelProvider');
  }
  return context;
}
