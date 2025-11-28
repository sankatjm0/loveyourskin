-- 008_update_notifications_types.sql
-- This migration attempts to remove any existing CHECK constraint that enforces allowed values
-- on the `type` column of `public.notifications` and then adds a new CHECK covering the expanded set

DO $$
DECLARE
  r RECORD;
  condef TEXT;
BEGIN
  -- Find any check constraints on the notifications table that reference the `type` column
  FOR r IN (
    SELECT con.oid, con.conname, pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    WHERE con.conrelid = 'public.notifications'::regclass
      AND con.contype = 'c'
  ) LOOP
    condef := r.def;
    IF condef ILIKE '%type%' AND condef ILIKE '%IN (%' THEN
      RAISE NOTICE 'Dropping constraint %: %', r.conname, condef;
      EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT %I', r.conname);
    END IF;
  END LOOP;

  -- Add a new constraint with expanded allowed types
  ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check CHECK (
      type IN (
        'order_status',
        'new_promotion',
        'new_order',
        'user_message',
        'contact_form',
        'user_registered',
        'product_edit',
        'user_profile_edit'
      )
    );

  RAISE NOTICE 'Updated notifications.type CHECK constraint.';
END$$;
