import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Subscription, PlanLimits } from '@/types/subscription';
import { PLAN_LIMITS } from '@/types/subscription';

interface UseSubscriptionReturn {
    subscription: Subscription | null;
    loading: boolean;
    isPro: boolean;
    isTrial: boolean;
    limits: PlanLimits;
    canAddMedication: (profileId: string) => Promise<boolean>;
    canAddDependent: () => Promise<boolean>;
    canAddDocument: () => Promise<boolean>;
    canAddEmergencyContact: () => Promise<boolean>;
    canShare: boolean;
    canExportReports: boolean;
    refreshSubscription: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSubscription = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;
            setSubscription(data);
        } catch (error) {
            console.error('Error fetching subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, [user]);

    const isPro = subscription?.plan_type === 'pro' && subscription?.status === 'active';
    const isTrial = subscription?.status === 'trial';
    const limits = isPro ? PLAN_LIMITS.pro : PLAN_LIMITS.free;

    const canAddMedication = async (profileId: string): Promise<boolean> => {
        if (limits.medicationsPerProfile === Infinity) return true;

        const { count } = await supabase
            .from('medications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profileId)
            .eq('active', true);

        return (count || 0) < limits.medicationsPerProfile;
    };

    const canAddDependent = async (): Promise<boolean> => {
        if (!user) return false;
        if (limits.dependents === Infinity) return true;

        const { count } = await supabase
            .from('caregiver_relationships')
            .select('*', { count: 'exact', head: true })
            .eq('caregiver_id', user.id)
            .eq('status', 'accepted');

        return (count || 0) < limits.dependents;
    };

    const canAddDocument = async (): Promise<boolean> => {
        if (!user) return false;
        if (limits.documents === Infinity) return true;

        const { count } = await supabase
            .from('medical_documents')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('archived', false);

        return (count || 0) < limits.documents;
    };

    const canAddEmergencyContact = async (): Promise<boolean> => {
        if (!user) return false;
        if (limits.emergencyContacts === Infinity) return true;

        const { count } = await supabase
            .from('emergency_contacts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        return (count || 0) < limits.emergencyContacts;
    };

    return {
        subscription,
        loading,
        isPro,
        isTrial,
        limits,
        canAddMedication,
        canAddDependent,
        canAddDocument,
        canAddEmergencyContact,
        canShare: limits.canShare,
        canExportReports: limits.canExportReports,
        refreshSubscription: fetchSubscription
    };
};
