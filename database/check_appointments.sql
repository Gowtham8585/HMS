-- Check Appointments Schema and Data
select 
  column_name, 
  data_type 
from information_schema.columns 
where table_name = 'appointments';

-- Check recent appointments
select * from public.appointments order by created_at desc limit 5;
