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
            // Check ADMINS table
            let { data: admin } = await supabase.from('admins').select('id, name').eq('id', userId).maybeSingle();
            if (admin) {
                setRole('admin');
                setUserName(admin.name);
                return;
            }

            // Check DOCTORS table
            let { data: doctor } = await supabase.from('doctors').select('id, name').eq('id', userId).maybeSingle();
            if (doctor) {
                setRole('doctor');
                setUserName(doctor.name);
                return;
            }

            // Check STAFF table (Receptionists)
            let { data: staff } = await supabase.from('staff').select('id, name, role').eq('id', userId).maybeSingle();
            if (staff && staff.role?.toLowerCase() === 'receptionist') {
                setRole('receptionist');
                setUserName(staff.name);
                return;
            }

            // Check PATIENTS table
            let { data: patient } = await supabase.from('patients').select('id, name').eq('id', userId).maybeSingle();
            if (patient) {
                setRole('patient');
                setUserName(patient.name);
                return;
            }

            // Check WORKERS table
            let { data: worker } = await supabase.from('workers').select('id, name').eq('id', userId).maybeSingle();
            if (worker) {
                setRole('worker');
                setUserName(worker.name);
                return;
            }

            // FALLBACK TO AUTH META (Last Resort)
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.user_metadata?.role) {
                console.log("Role found in metadata:", user.user_metadata.role);
                setRole(user.user_metadata.role);
                setUserName(user.user_metadata.displayName || user.email.split('@')[0]);

                // OPTIONAL: Auto-create record in specific table if missing? 
                // For now, let's just allow access based on metadata to unblock login.
            } else {
                console.error("Role not found in any table or metadata");
                setRole(null);
            }

        } catch (error) {
            console.error("Critical Profile Fetch Error:", error);
            setRole(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
            setUser(data.user);
            await fetchUserProfile(data.user.id);
        }
    };

    const signUp = async (email, password, name, role, specialization = null, phone = null, address = null) => {
        // 1. Sign up auth user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    displayName: name,
                    role: role, // Still store in metadata as backup
                    specialization: specialization
                }
            }
        });
        if (error) throw error;

        // 2. Insert into Specific Table based on Role
        if (data.user) {
            const userId = data.user.id;

            if (role === 'admin') {
                await supabase.from('admins').insert([{ id: userId, name, email }]);
            } else if (role === 'doctor') {
                await supabase.from('doctors').insert([{ id: userId, name, email, specialization, address }]);
            } else if (role === 'receptionist') {
                await supabase.from('staff').insert([{ id: userId, name, email, role: 'Receptionist', phone, address, salary: 0 }]);
            } else if (role === 'patient') {
                await supabase.from('patients').insert([{ id: userId, name, phone, address, medical_history: 'New Patient' }]);
            } else if (role === 'worker') {
                await supabase.from('workers').insert([{ id: userId, name, role: 'General', email, phone, address }]);
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
