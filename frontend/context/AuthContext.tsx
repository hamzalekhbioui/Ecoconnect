import React, { createContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

// Profile type matching the database schema
export interface Profile {
    id: string;
    full_name: string;
    email: string | null;
    avatar_url: string | null;
    role: 'admin' | 'member' | 'visitor';
    status: 'pending' | 'approved' | 'pending_review' | 'rejected';
    credits: number;
    bio: string | null;
    industry: string | null;
    phone: string | null;
    country: string | null;
    application_note: string | null;
    created_at: string;
}

// Auth context type
export interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    isAuthenticated: boolean;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    // Use refs to avoid stale closure issues in onAuthStateChange callback
    const profileFetchedRef = useRef(false);
    const cachedProfileIdRef = useRef<string | null>(null);

    // Fetch user profile from database with timeout to prevent infinite loading
    const fetchProfile = async (userId: string): Promise<Profile | null> => {
        try {
            // Create a timeout promise to prevent hanging
            const timeoutPromise = new Promise<null>((resolve) => {
                setTimeout(() => {
                    console.warn('Profile fetch timeout - continuing without profile');
                    resolve(null);
                }, 5000);
            });

            const fetchPromise = (async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) {
                    console.error('Error fetching profile:', error);
                    return null;
                }
                return data as Profile;
            })();

            // Race between fetch and timeout
            return await Promise.race([fetchPromise, timeoutPromise]);
        } catch (err) {
            console.error('Error fetching profile:', err);
            return null;
        }
    };

    // Refresh profile data
    const refreshProfile = async () => {
        if (user) {
            const profileData = await fetchProfile(user.id);
            setProfile(profileData);
        }
    };

    // Initialize auth state
    useEffect(() => {
        // Get initial session with timeout to prevent infinite loading
        const initializeAuth = async () => {
            try {
                // Force sign out on app startup - user must log in fresh
                await supabase.auth.signOut();
                setUser(null);
                setSession(null);
                setProfile(null);
            } catch (error) {
                console.error('Error initializing auth:', error);
                setSession(null);
                setUser(null);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                try {
                    setSession(currentSession);
                    setUser(currentSession?.user ?? null);

                    if (currentSession?.user) {
                        // Only fetch profile if:
                        // 1. User just signed in with a DIFFERENT account (not token refresh for same user)
                        // 2. Profile was never fetched yet (and not INITIAL_SESSION which is handled by initializeAuth)
                        // Note: Supabase fires SIGNED_IN during token recovery - we must check user ID!
                        const isNewUser = cachedProfileIdRef.current !== currentSession.user.id;
                        const shouldFetchProfile =
                            (event === 'SIGNED_IN' && isNewUser) ||
                            (!profileFetchedRef.current && event !== 'INITIAL_SESSION');

                        console.log('[AuthContext] onAuthStateChange:', {
                            event,
                            profileFetched: profileFetchedRef.current,
                            cachedId: cachedProfileIdRef.current,
                            currentUserId: currentSession.user.id,
                            isNewUser,
                            shouldFetchProfile
                        });

                        if (shouldFetchProfile) {
                            // Small delay to allow trigger to create profile on sign up
                            if (event === 'SIGNED_IN') {
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }
                            const profileData = await fetchProfile(currentSession.user.id);
                            setProfile(profileData);
                            profileFetchedRef.current = true;
                            cachedProfileIdRef.current = currentSession.user.id;
                        }
                        // For TOKEN_REFRESHED, same-user SIGNED_IN, INITIAL_SESSION, etc. - keep existing profile
                    } else {
                        setProfile(null);
                        profileFetchedRef.current = false;
                        cachedProfileIdRef.current = null;
                    }
                } catch (err) {
                    console.error('Error in auth state change handler:', err);
                    setProfile(null);
                } finally {
                    // Always ensure loading is set to false
                    setLoading(false);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Sign up with email and password
    const signUp = async (email: string, password: string, fullName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });
        return { error };
    };

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    // Sign out
    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error signing out:', error.message);
            }
        } catch (err) {
            console.error('Unexpected error during sign out:', err);
        } finally {
            // Always clear local state, even if server call fails
            setUser(null);
            setSession(null);
            setProfile(null);
        }
    };

    const value: AuthContextType = {
        user,
        session,
        profile,
        loading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        signOut,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
