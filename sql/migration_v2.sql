-- ============================================================================
-- OlmedoRides - Migración v2
-- Úsala si YA tienes el esquema anterior creado y no quieres borrar datos.
-- Ejecutar en Supabase Dashboard > SQL Editor.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- Columnas nuevas
-- ----------------------------------------------------------------------------
ALTER TABLE public.cars      ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.drivers   ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.drivers   ALTER COLUMN license_number DROP NOT NULL;

ALTER TABLE public.travels   ADD COLUMN IF NOT EXISTS travel_code TEXT;
ALTER TABLE public.travels   ADD COLUMN IF NOT EXISTS route TEXT;
ALTER TABLE public.travels   ADD COLUMN IF NOT EXISTS average_duration_minutes INTEGER DEFAULT 0;
ALTER TABLE public.travels   ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.travels   ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;
ALTER TABLE public.travels   ADD COLUMN IF NOT EXISTS start_lat NUMERIC(10,7);
ALTER TABLE public.travels   ADD COLUMN IF NOT EXISTS start_lng NUMERIC(10,7);
ALTER TABLE public.travels   ADD COLUMN IF NOT EXISTS finish_lat NUMERIC(10,7);
ALTER TABLE public.travels   ADD COLUMN IF NOT EXISTS finish_lng NUMERIC(10,7);
ALTER TABLE public.travels   DROP COLUMN IF EXISTS driver_image_url;
ALTER TABLE public.travels   DROP COLUMN IF EXISTS vehicle_image_url;
ALTER TABLE public.travels   ALTER COLUMN max_seats SET DEFAULT 4;
ALTER TABLE public.travels   ALTER COLUMN title DROP NOT NULL;

ALTER TABLE public.seats     ADD COLUMN IF NOT EXISTS seat_position TEXT;
ALTER TABLE public.seats     ADD COLUMN IF NOT EXISTS luggage_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.seats     ADD COLUMN IF NOT EXISTS estimated_weight_kg NUMERIC(5,2);

ALTER TABLE public.bookings  ADD COLUMN IF NOT EXISTS luggage_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.bookings  ADD COLUMN IF NOT EXISTS estimated_weight_kg NUMERIC(5,2);
ALTER TABLE public.bookings  ADD COLUMN IF NOT EXISTS pickup_option TEXT DEFAULT 'current';
ALTER TABLE public.bookings  ADD COLUMN IF NOT EXISTS pickup_lat NUMERIC(10,7);
ALTER TABLE public.bookings  ADD COLUMN IF NOT EXISTS pickup_lng NUMERIC(10,7);
ALTER TABLE public.bookings  ADD COLUMN IF NOT EXISTS pickup_address TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'bookings_pickup_option_check'
          AND conrelid = 'public.bookings'::regclass
    ) THEN
        ALTER TABLE public.bookings
            ADD CONSTRAINT bookings_pickup_option_check
            CHECK (pickup_option IN ('current', 'other'));
    END IF;
END $$;

-- Posiciones para viajes existentes (asientos 1..4)
UPDATE public.seats
SET seat_position = CASE seat_number
    WHEN 1 THEN 'front_right'
    WHEN 2 THEN 'back_left'
    WHEN 3 THEN 'back_middle'
    WHEN 4 THEN 'back_right'
END
WHERE seat_position IS NULL AND seat_number BETWEEN 1 AND 4;

-- Códigos para viajes existentes
DO $$
DECLARE
    r RECORD;
    v_code TEXT;
BEGIN
    FOR r IN SELECT id FROM public.travels WHERE travel_code IS NULL OR BTRIM(travel_code) = '' LOOP
        LOOP
            v_code := 'OLM-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.travels WHERE travel_code = v_code);
        END LOOP;
        UPDATE public.travels SET travel_code = v_code, title = COALESCE(NULLIF(title, ''), source_city || ' → ' || destination_city) WHERE id = r.id;
    END LOOP;
END $$;

ALTER TABLE public.travels ALTER COLUMN travel_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_travels_code ON public.travels(travel_code);

-- Restricción de posición (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'seats_seat_position_check'
          AND conrelid = 'public.seats'::regclass
    ) THEN
        ALTER TABLE public.seats
            ADD CONSTRAINT seats_seat_position_check
            CHECK (seat_position IN ('front_right', 'back_left', 'back_middle', 'back_right'));
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Helpers de roles
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_staff(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role IN ('admin', 'secretary'));
$$;

-- ----------------------------------------------------------------------------
-- Código único de viaje
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_travel_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
BEGIN
    LOOP
        v_code := 'OLM-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.travels WHERE travel_code = v_code);
    END LOOP;
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_travel_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.travel_code IS NULL OR BTRIM(NEW.travel_code) = '' THEN
        NEW.travel_code := public.generate_travel_code();
    END IF;
    IF NEW.title IS NULL OR BTRIM(NEW.title) = '' THEN
        NEW.title := NEW.source_city || ' → ' || NEW.destination_city;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_travel_code ON public.travels;
CREATE TRIGGER trigger_set_travel_code
    BEFORE INSERT ON public.travels
    FOR EACH ROW EXECUTE FUNCTION public.set_travel_code();

-- ----------------------------------------------------------------------------
-- Asientos: 1 delantero derecho + 3 atrás
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_seats_for_travel()
RETURNS TRIGGER AS $$
DECLARE
    v_positions TEXT[][] := ARRAY[
        ['front_right', 'Delantero derecho'],
        ['back_left',   'Atrás izquierda'],
        ['back_middle', 'Atrás centro'],
        ['back_right',  'Atrás derecha']
    ];
    i INTEGER;
BEGIN
    FOR i IN 1..4 LOOP
        INSERT INTO public.seats (travel_id, seat_number, seat_position, price)
        VALUES (NEW.id, i, v_positions[i][1], NEW.price_per_seat)
        ON CONFLICT (travel_id, seat_number) DO NOTHING;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_seats_for_travel ON public.travels;
CREATE TRIGGER trigger_create_seats_for_travel
    AFTER INSERT ON public.travels
    FOR EACH ROW EXECUTE FUNCTION public.create_seats_for_travel();

-- ----------------------------------------------------------------------------
-- Perfil automático para Google / registro
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_role public.user_role := 'traveler';
    v_meta_role TEXT;
    v_full_name TEXT;
    v_avatar TEXT;
BEGIN
    v_meta_role := COALESCE(NEW.raw_user_meta_data->>'role', 'traveler');
    IF v_meta_role NOT IN ('driver', 'traveler') THEN
        v_meta_role := 'traveler';
    END IF;
    v_role := v_meta_role::public.user_role;

    v_full_name := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        NULLIF(NEW.raw_user_meta_data->>'name', ''),
        SPLIT_PART(COALESCE(NEW.email, 'usuario'), '@', 1)
    );
    v_avatar := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
        NULLIF(NEW.raw_user_meta_data->>'picture', '')
    );

    INSERT INTO public.profiles AS p (id, email, full_name, role, phone, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, NEW.id::TEXT || '@olmedorides.local'),
        v_full_name,
        v_role,
        NULLIF(NEW.raw_user_meta_data->>'phone', ''),
        v_avatar
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(p.full_name, EXCLUDED.full_name),
        avatar_url = COALESCE(p.avatar_url, EXCLUDED.avatar_url);

    IF v_role = 'driver' THEN
        INSERT INTO public.drivers (id, license_number, is_available)
        VALUES (NEW.id, 'PENDIENTE-' || LEFT(NEW.id::TEXT, 8), TRUE)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Protección de roles
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id
           AND NEW.role NOT IN ('driver', 'traveler') THEN
            NEW.role := 'traveler';
        END IF;
        RETURN NEW;
    END IF;

    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF current_setting('olmedorides.allow_role_change', TRUE) = 'on' THEN
            RETURN NEW;
        END IF;
        IF NOT public.is_admin(auth.uid()) THEN
            RAISE EXCEPTION 'Solo un administrador puede cambiar roles';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_profile_role ON public.profiles;
CREATE TRIGGER trigger_protect_profile_role
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- ----------------------------------------------------------------------------
-- Registro Google + conductor + reservas atómicas
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_registration(p_role TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
    IF p_role NOT IN ('driver', 'traveler') THEN RAISE EXCEPTION 'Rol inválido'; END IF;

    PERFORM set_config('olmedorides.allow_role_change', 'on', TRUE);
    UPDATE public.profiles SET role = p_role::public.user_role
    WHERE id = auth.uid() AND role = 'traveler';

    IF p_role = 'driver' THEN
        INSERT INTO public.drivers (id, license_number, is_available)
        VALUES (auth.uid(), 'PENDIENTE-' || LEFT(auth.uid()::TEXT, 8), TRUE)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_role(p_user_id UUID, p_role TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Solo un administrador puede cambiar roles';
    END IF;
    IF p_role NOT IN ('admin', 'secretary', 'driver', 'traveler') THEN
        RAISE EXCEPTION 'Rol inválido';
    END IF;
    IF p_user_id = auth.uid() AND p_role <> 'admin' THEN
        RAISE EXCEPTION 'No puedes quitarte tu propio rol de administrador';
    END IF;

    PERFORM set_config('olmedorides.allow_role_change', 'on', TRUE);
    UPDATE public.profiles SET role = p_role::public.user_role WHERE id = p_user_id;

    IF p_role = 'driver' THEN
        INSERT INTO public.drivers (id, license_number, is_available)
        VALUES (p_user_id, 'PENDIENTE-' || LEFT(p_user_id::TEXT, 8), TRUE)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_travel(p_travel_id UUID)
RETURNS public.travels LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_travel public.travels;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'driver') THEN
        RAISE EXCEPTION 'Solo los conductores pueden tomar viajes';
    END IF;

    INSERT INTO public.drivers (id, license_number, is_available)
    VALUES (auth.uid(), 'PENDIENTE-' || LEFT(auth.uid()::TEXT, 8), TRUE)
    ON CONFLICT (id) DO NOTHING;

    UPDATE public.travels SET driver_id = auth.uid()
    WHERE id = p_travel_id AND driver_id IS NULL AND status = 'scheduled'
    RETURNING * INTO v_travel;

    IF v_travel IS NULL THEN
        RAISE EXCEPTION 'El viaje ya tiene conductor o no está disponible';
    END IF;
    RETURN v_travel;
END;
$$;

DROP FUNCTION IF EXISTS public.book_seat(UUID, UUID, BOOLEAN, NUMERIC);

CREATE OR REPLACE FUNCTION public.start_travel(
    p_travel_id UUID,
    p_lat NUMERIC,
    p_lng NUMERIC
)
RETURNS public.travels LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_travel public.travels;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
    IF p_lat IS NULL OR p_lng IS NULL THEN
        RAISE EXCEPTION 'La ubicación es obligatoria para iniciar el viaje';
    END IF;

    SELECT * INTO v_travel FROM public.travels WHERE id = p_travel_id FOR UPDATE;
    IF v_travel IS NULL THEN RAISE EXCEPTION 'Viaje no encontrado'; END IF;
    IF v_travel.driver_id <> auth.uid() THEN
        RAISE EXCEPTION 'No eres el conductor de este viaje';
    END IF;
    IF v_travel.status <> 'scheduled' THEN
        RAISE EXCEPTION 'El viaje no está programado';
    END IF;

    UPDATE public.travels
    SET status = 'in_progress', started_at = NOW(), start_lat = p_lat, start_lng = p_lng
    WHERE id = p_travel_id
    RETURNING * INTO v_travel;

    RETURN v_travel;
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_travel(
    p_travel_id UUID,
    p_lat NUMERIC,
    p_lng NUMERIC
)
RETURNS public.travels LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_travel public.travels;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
    IF p_lat IS NULL OR p_lng IS NULL THEN
        RAISE EXCEPTION 'La ubicación es obligatoria para terminar el viaje';
    END IF;

    SELECT * INTO v_travel FROM public.travels WHERE id = p_travel_id FOR UPDATE;
    IF v_travel IS NULL THEN RAISE EXCEPTION 'Viaje no encontrado'; END IF;
    IF v_travel.driver_id <> auth.uid() THEN
        RAISE EXCEPTION 'No eres el conductor de este viaje';
    END IF;
    IF v_travel.status <> 'in_progress' THEN
        RAISE EXCEPTION 'El viaje no está en curso';
    END IF;

    UPDATE public.travels
    SET status = 'completed', finished_at = NOW(), finish_lat = p_lat, finish_lng = p_lng
    WHERE id = p_travel_id
    RETURNING * INTO v_travel;

    UPDATE public.drivers
    SET total_trips = COALESCE(total_trips, 0) + 1
    WHERE id = auth.uid();

    RETURN v_travel;
END;
$$;

CREATE OR REPLACE FUNCTION public.book_seat(
    p_travel_id UUID,
    p_seat_id UUID,
    p_luggage BOOLEAN DEFAULT FALSE,
    p_weight NUMERIC DEFAULT NULL,
    p_pickup_option TEXT DEFAULT 'current',
    p_pickup_lat NUMERIC DEFAULT NULL,
    p_pickup_lng NUMERIC DEFAULT NULL,
    p_pickup_address TEXT DEFAULT NULL
)
RETURNS public.bookings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_travel public.travels;
    v_seat public.seats;
    v_booking public.bookings;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;

    SELECT * INTO v_travel FROM public.travels WHERE id = p_travel_id FOR UPDATE;
    IF v_travel IS NULL THEN RAISE EXCEPTION 'Viaje no encontrado'; END IF;
    IF v_travel.status <> 'scheduled' OR v_travel.departure_time <= NOW() THEN
        RAISE EXCEPTION 'El viaje no está disponible';
    END IF;

    SELECT * INTO v_seat FROM public.seats
    WHERE id = p_seat_id AND travel_id = p_travel_id FOR UPDATE;
    IF v_seat IS NULL THEN RAISE EXCEPTION 'Asiento no encontrado'; END IF;
    IF v_seat.status <> 'available' THEN RAISE EXCEPTION 'El asiento ya no está disponible'; END IF;

    IF EXISTS (
        SELECT 1 FROM public.bookings
        WHERE traveler_id = auth.uid() AND travel_id = p_travel_id AND status <> 'cancelled'
    ) THEN
        RAISE EXCEPTION 'Ya tienes una reserva en este viaje';
    END IF;

    IF COALESCE(p_luggage, FALSE) AND (p_weight IS NULL OR p_weight <= 0) THEN
        RAISE EXCEPTION 'Indica el peso estimado del equipaje';
    END IF;

    IF COALESCE(p_pickup_option, 'current') NOT IN ('current', 'other') THEN
        RAISE EXCEPTION 'Opción de recogida inválida';
    END IF;
    IF p_pickup_lat IS NULL OR p_pickup_lng IS NULL THEN
        RAISE EXCEPTION 'Indica la ubicación de recogida';
    END IF;

    UPDATE public.seats
    SET status = 'reserved', traveler_id = auth.uid(), reserved_at = NOW(),
        luggage_confirmed = COALESCE(p_luggage, FALSE),
        estimated_weight_kg = CASE WHEN COALESCE(p_luggage, FALSE) THEN p_weight ELSE NULL END
    WHERE id = p_seat_id;

    INSERT INTO public.bookings (
        travel_id, traveler_id, seat_id, total_price,
        luggage_confirmed, estimated_weight_kg,
        pickup_option, pickup_lat, pickup_lng, pickup_address
    ) VALUES (
        p_travel_id, auth.uid(), p_seat_id,
        COALESCE(v_seat.price, v_travel.price_per_seat),
        COALESCE(p_luggage, FALSE),
        CASE WHEN COALESCE(p_luggage, FALSE) THEN p_weight ELSE NULL END,
        COALESCE(p_pickup_option, 'current'),
        p_pickup_lat,
        p_pickup_lng,
        NULLIF(BTRIM(COALESCE(p_pickup_address, '')), '')
    ) RETURNING * INTO v_booking;

    RETURN v_booking;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_booking public.bookings;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;

    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF v_booking IS NULL THEN RAISE EXCEPTION 'Reserva no encontrada'; END IF;
    IF v_booking.traveler_id <> auth.uid() AND NOT public.is_staff(auth.uid()) THEN
        RAISE EXCEPTION 'No puedes cancelar esta reserva';
    END IF;
    IF v_booking.status = 'cancelled' THEN RETURN; END IF;

    UPDATE public.bookings SET status = 'cancelled' WHERE id = p_booking_id;
    UPDATE public.seats
    SET status = 'available', traveler_id = NULL, reserved_at = NULL,
        luggage_confirmed = FALSE, estimated_weight_kg = NULL
    WHERE id = v_booking.seat_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- Políticas RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view cars" ON public.cars;
DROP POLICY IF EXISTS "Admins/secretaries can manage cars" ON public.cars;
DROP POLICY IF EXISTS "cars_select_authenticated" ON public.cars;
DROP POLICY IF EXISTS "cars_manage_staff" ON public.cars;
CREATE POLICY "cars_select_authenticated" ON public.cars FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "cars_manage_staff" ON public.cars FOR ALL TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Drivers can view own profile" ON public.drivers;
DROP POLICY IF EXISTS "Admins/secretaries can manage drivers" ON public.drivers;
DROP POLICY IF EXISTS "drivers_select_authenticated" ON public.drivers;
DROP POLICY IF EXISTS "drivers_insert_self_or_staff" ON public.drivers;
DROP POLICY IF EXISTS "drivers_update_self_or_staff" ON public.drivers;
DROP POLICY IF EXISTS "drivers_delete_staff" ON public.drivers;
CREATE POLICY "drivers_select_authenticated" ON public.drivers FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "drivers_insert_self_or_staff" ON public.drivers FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "drivers_update_self_or_staff" ON public.drivers FOR UPDATE TO authenticated
    USING (auth.uid() = id OR public.is_staff(auth.uid()))
    WITH CHECK (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "drivers_delete_staff" ON public.drivers FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view scheduled travels" ON public.travels;
DROP POLICY IF EXISTS "Travelers can view available travels" ON public.travels;
DROP POLICY IF EXISTS "Drivers can view assigned travels" ON public.travels;
DROP POLICY IF EXISTS "Admins/secretaries can manage all travels" ON public.travels;
DROP POLICY IF EXISTS "travels_select_authenticated" ON public.travels;
DROP POLICY IF EXISTS "travels_manage_staff" ON public.travels;
CREATE POLICY "travels_select_authenticated" ON public.travels FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "travels_manage_staff" ON public.travels FOR ALL TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view seats for scheduled travels" ON public.seats;
DROP POLICY IF EXISTS "Travelers can reserve available seats" ON public.seats;
DROP POLICY IF EXISTS "Admins/secretaries can manage seats" ON public.seats;
DROP POLICY IF EXISTS "seats_select_authenticated" ON public.seats;
DROP POLICY IF EXISTS "seats_manage_staff" ON public.seats;
CREATE POLICY "seats_select_authenticated" ON public.seats FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "seats_manage_staff" ON public.seats FOR ALL TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Travelers can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Travelers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins/secretaries can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_own_or_staff" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_driver_travels" ON public.bookings;
DROP POLICY IF EXISTS "bookings_manage_staff" ON public.bookings;
CREATE POLICY "bookings_select_own_or_staff" ON public.bookings FOR SELECT TO authenticated
    USING (traveler_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "bookings_select_driver_travels" ON public.bookings FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.travels t
            WHERE t.id = bookings.travel_id
              AND t.driver_id = auth.uid()
        )
    );
CREATE POLICY "bookings_manage_staff" ON public.bookings FOR ALL TO authenticated
    USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_registration(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_travel(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_travel(UUID, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_travel(UUID, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_seat(UUID, UUID, BOOLEAN, NUMERIC, TEXT, NUMERIC, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_role(UUID, TEXT) TO authenticated;

-- ----------------------------------------------------------------------------
-- Cuenta admin: adm!n / 12345
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@olmedorides.app' LIMIT 1;

    IF v_admin_id IS NULL THEN
        v_admin_id := gen_random_uuid();

        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, confirmation_token, email_change,
            email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
            'admin@olmedorides.app', crypt('12345', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Administrador OlmedoRides","role":"traveler"}'::jsonb,
            NOW(), NOW(), '', '', '', ''
        );

        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider,
            last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_admin_id, v_admin_id::TEXT,
            jsonb_build_object('sub', v_admin_id::TEXT, 'email', 'admin@olmedorides.app'),
            'email', NOW(), NOW(), NOW()
        );
    END IF;

    INSERT INTO public.profiles AS p (id, email, full_name, role)
    VALUES (v_admin_id, 'admin@olmedorides.app', 'Administrador OlmedoRides', 'admin')
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(p.full_name, EXCLUDED.full_name),
        role = 'admin';
END $$;

-- ----------------------------------------------------------------------------
-- Usuario de prueba: alias "user" / contraseña "1234"
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'user@olmedorides.app'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();

        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, confirmation_token, email_change,
            email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            'user@olmedorides.app',
            crypt('1234', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Usuario de Prueba","role":"traveler"}'::jsonb,
            NOW(), NOW(), '', '', '', ''
        );

        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider,
            last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id,
            v_user_id::TEXT,
            jsonb_build_object('sub', v_user_id::TEXT, 'email', 'user@olmedorides.app'),
            'email',
            NOW(), NOW(), NOW()
        );
    END IF;

    INSERT INTO public.profiles AS p (id, email, full_name, role)
    VALUES (v_user_id, 'user@olmedorides.app', 'Usuario de Prueba', 'traveler')
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(p.full_name, EXCLUDED.full_name);
END $$;

-- Fin de la migración
