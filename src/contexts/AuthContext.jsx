import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [userName, setUserName] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserProfile(session.user.id);
            } else {
                setRole(null);
                setUserName(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId) => {
        try {
            // Try fetching both role and name
            const { data, error } = await supabase
                .from('profiles')
                .select('role, name')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn("Error fetching profile, retrying with role only:", error.message);
                // Fallback: Try fetching just role if 'name' caused the issue
                const { data: roleData, error: roleError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();

                if (roleError) throw roleError;
                setRole(roleData?.role);
                // Name remains null
            } else {
                setRole(data?.role);
                setUserName(data?.name);
            }
        } catch (error) {
            console.error("Critical Profile Fetch Error:", error);
            // Don't set loading false here, let finally handle it
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signUp = async (email, password, name, role, specialization = null) => {
        // 1. Sign up auth user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    displayName: name,
                    role: role,
                    specialization: specialization
                }
            }
        });
        if (error) throw error;

        // 2. Create profile & patient record if applicable
        if (data.user) {
            // Check if profile already exists
            const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', data.user.id).single();

            if (!existingProfile) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: data.user.id,
                        name,
                        email,
                        role,
                        specialization: specialization
                    }]);

                if (profileError) throw profileError;

                // 3. If role is patient, also create entry in 'patients' table
                if (role === 'patient') {
                    await supabase.from('patients').insert([{
                        id: data.user.id, // Use same UUID
                        name: name,
                        medical_history: 'New Patient Registration'
                    }]);
                }
            }
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setRole(null);
        setUserName(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, role, userName, loading, login, signUp, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
