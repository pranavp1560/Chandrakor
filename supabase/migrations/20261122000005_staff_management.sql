-- Migration: 20261122000005_staff_management.sql
-- Description: Secure RPC function for Super Admin to provision and manage Staff Users

CREATE OR REPLACE FUNCTION public.create_staff_user(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_role_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_existing_id UUID;
    v_role_name TEXT;
    v_is_super BOOLEAN;
BEGIN
    -- Verify the caller is an active Super Admin or has admin:manage_users permission
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_profiles ap
        JOIN public.roles r ON ap.role_id = r.id
        WHERE ap.id = auth.uid()
          AND ap.is_active = true
          AND r.name = 'Super Admin'
    ) INTO v_is_super;

    IF NOT v_is_super AND NOT public.has_permission('admin:manage_users') THEN
        RAISE EXCEPTION 'Access Denied: Only authorized Super Admins can provision staff accounts.';
    END IF;

    -- Validate email and password length
    IF length(trim(p_email)) < 5 OR position('@' in p_email) = 0 THEN
        RAISE EXCEPTION 'A valid email address is required.';
    END IF;

    IF length(p_password) < 6 THEN
        RAISE EXCEPTION 'Password must be at least 6 characters.';
    END IF;

    -- Check if role exists
    SELECT name INTO v_role_name FROM public.roles WHERE id = p_role_id;
    IF v_role_name IS NULL THEN
        RAISE EXCEPTION 'Invalid role selected.';
    END IF;

    -- Check if user already exists in auth.users
    SELECT id INTO v_existing_id FROM auth.users WHERE lower(email) = lower(trim(p_email));
    
    IF v_existing_id IS NOT NULL THEN
        -- User exists in auth.users, update password & link profile
        UPDATE auth.users
        SET encrypted_password = crypt(p_password, gen_salt('bf')),
            updated_at = NOW(),
            raw_user_meta_data = jsonb_build_object('full_name', trim(p_full_name))
        WHERE id = v_existing_id;

        INSERT INTO public.admin_profiles (id, full_name, email, role_id, is_active)
        VALUES (v_existing_id, trim(p_full_name), lower(trim(p_email)), p_role_id, true)
        ON CONFLICT (id) DO UPDATE
        SET full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            role_id = EXCLUDED.role_id,
            is_active = true;
            
        v_user_id := v_existing_id;
    ELSE
        -- Generate user id
        v_user_id := gen_random_uuid();
        
        -- Insert into auth.users with encrypted password and confirmed email
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            lower(trim(p_email)),
            crypt(p_password, gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('full_name', trim(p_full_name)),
            NOW(),
            NOW(),
            encode(gen_random_bytes(32), 'hex'),
            encode(gen_random_bytes(32), 'hex')
        );

        -- Insert into admin_profiles
        INSERT INTO public.admin_profiles (id, full_name, email, role_id, is_active)
        VALUES (v_user_id, trim(p_full_name), lower(trim(p_email)), p_role_id, true);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'email', lower(trim(p_email)),
        'full_name', trim(p_full_name),
        'role', v_role_name
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_staff_user(TEXT, TEXT, TEXT, UUID) TO authenticated;
