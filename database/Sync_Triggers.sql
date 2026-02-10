
-- 1. Function to handle profile changes and sync to role tables
CREATE OR REPLACE FUNCTION public.sync_profile_to_role_table()
RETURNS TRIGGER AS $$
BEGIN
  -- ADMINS
  IF NEW.role = 'admin' THEN
    INSERT INTO public.admins (id, name, email)
    VALUES (NEW.id, NEW.name, NEW.email)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
  
  -- DOCTORS
  ELSIF NEW.role = 'doctor' THEN
    INSERT INTO public.doctors (id, name, email)
    VALUES (NEW.id, NEW.name, NEW.email)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
  
  -- RECEPTIONISTS (Assuming 'staff' table or 'receptionists')
  -- We'll try 'staff' first, if your schema uses that. 
  -- IF YOU USE 'receptionists', CHANGE THIS TO public.receptionists
  ELSIF NEW.role = 'receptionist' THEN
    INSERT INTO public.staff (id, name, email, role)
    VALUES (NEW.id, NEW.name, NEW.email, 'receptionist')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

  -- PATIENTS
  ELSIF NEW.role = 'patient' THEN
    INSERT INTO public.patients (id, name)
    VALUES (NEW.id, NEW.name)
    ON CONFLICT (id) DO NOTHING; -- Patients have more data, don't overwrite blindly
    
  -- WORKERS
  ELSIF NEW.role = 'worker' THEN
    INSERT INTO public.workers (id, name)
    VALUES (NEW.id, NEW.name)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger on Profiles
DROP TRIGGER IF EXISTS on_profile_change ON public.profiles;
CREATE TRIGGER on_profile_change
AFTER INSERT OR UPDATE OF role, name, email ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_role_table();

-- 3. Run a Backfill Update (Updates everyone to trigger the function)
UPDATE public.profiles SET role = role; 
