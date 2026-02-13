import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LandingContentItem {
    id: string;
    section: string;
    key: string;
    value: any;
    updated_at: string;
    updated_by: string | null;
}

interface OrganizedContent {
    [section: string]: {
        [key: string]: any;
    };
}

export const useLandingContent = () => {
    const [content, setContent] = useState<OrganizedContent>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContent = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('landing_content')
                .select('*')
                .order('section', { ascending: true });

            if (fetchError) throw fetchError;

            // Organize content by section and key
            const organized: OrganizedContent = {};
            data?.forEach((item: LandingContentItem) => {
                if (!organized[item.section]) {
                    organized[item.section] = {};
                }
                organized[item.section][item.key] = item.value;
            });

            setContent(organized);
            setError(null);
        } catch (err) {
            console.error('Error fetching landing content:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch content');
        } finally {
            setLoading(false);
        }
    };

    const updateContent = async (section: string, key: string, value: any) => {
        try {
            const { error: updateError } = await supabase
                .from('landing_content')
                .upsert(
                    { section, key, value },
                    { onConflict: 'section,key' }
                );

            if (updateError) throw updateError;

            // Refresh content after update
            await fetchContent();
            return { success: true };
        } catch (err) {
            console.error('Error updating landing content:', err);
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Failed to update content'
            };
        }
    };

    const updateMultiple = async (updates: Array<{ section: string; key: string; value: any }>) => {
        try {
            const { error: updateError } = await supabase
                .from('landing_content')
                .upsert(updates, { onConflict: 'section,key' });

            if (updateError) throw updateError;

            await fetchContent();
            return { success: true };
        } catch (err) {
            console.error('Error updating multiple content items:', err);
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Failed to update content'
            };
        }
    };

    useEffect(() => {
        fetchContent();

        // Subscribe to real-time updates
        const subscription = supabase
            .channel('landing_content_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'landing_content'
                },
                () => {
                    fetchContent();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return {
        content,
        loading,
        error,
        updateContent,
        updateMultiple,
        refetch: fetchContent
    };
};
