export interface Subscription {
    id: string;
    user_id: string;
    plan_type: 'free' | 'pro';
    status: 'active' | 'trial' | 'canceled' | 'expired';
    trial_ends_at?: string;
    current_period_start: string;
    current_period_end: string;
    stripe_subscription_id?: string;
    stripe_customer_id?: string;
    has_storage_addon: boolean;
    created_at: string;
    updated_at: string;
}

export interface PlanLimits {
    dependents: number;
    medicationsPerProfile: number;
    historyDays: number;
    documents: number;
    documentSizeMB: number;
    documentRetentionDays: number;
    emergencyContacts: number;
    canShare: boolean;
    canExportReports: boolean;
}

export const PLAN_LIMITS: Record<'free' | 'pro', PlanLimits> = {
    free: {
        dependents: 1,
        medicationsPerProfile: 5,
        historyDays: 90,
        documents: 10,
        documentSizeMB: 10,
        documentRetentionDays: 180, // 6 months
        emergencyContacts: 1,
        canShare: false,
        canExportReports: false
    },
    pro: {
        dependents: 5,
        medicationsPerProfile: Infinity,
        historyDays: Infinity,
        documents: Infinity,
        documentSizeMB: 50,
        documentRetentionDays: 730, // 24 months (or Infinity with storage addon)
        emergencyContacts: 5,
        canShare: true,
        canExportReports: true
    }
};
