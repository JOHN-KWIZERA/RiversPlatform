-- ============================================================
-- RIVERS PLATFORM — Application status notifications
-- Adds application_accepted / application_rejected notification
-- types and a trigger that auto-creates an in-app notification
-- whenever a volunteer application status changes.
-- ============================================================

-- 1. Expand the notification type CHECK constraint
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'campaign_approved','campaign_rejected',
    'donation_received','campaign_milestone',
    'campaign_created','info',
    'application_accepted','application_rejected'
  ));

-- 2. Trigger function
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_opp_title TEXT;
  v_notif_type TEXT;
  v_notif_title TEXT;
  v_notif_body  TEXT;
BEGIN
  -- Only fire when status actually changes to accepted or rejected
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('accepted', 'rejected') THEN RETURN NEW; END IF;

  SELECT title INTO v_opp_title
  FROM public.opportunities WHERE id = NEW.opportunity_id;

  IF NEW.status = 'accepted' THEN
    v_notif_type  := 'application_accepted';
    v_notif_title := 'Application Accepted!';
    v_notif_body  := 'Congratulations! Your application for "' || v_opp_title ||
                     '" has been accepted. The organizer will be in touch with next steps.';
  ELSE
    v_notif_type  := 'application_rejected';
    v_notif_title := 'Application Update';
    v_notif_body  := 'Thank you for applying to "' || v_opp_title ||
                     '". Unfortunately your application was not selected this time. Keep an eye out for new opportunities!';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.user_id,
    v_notif_type,
    v_notif_title,
    v_notif_body,
    '/dashboard/opportunities/' || NEW.opportunity_id::TEXT
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger
DROP TRIGGER IF EXISTS trg_application_status_notification ON public.volunteer_applications;
CREATE TRIGGER trg_application_status_notification
  AFTER UPDATE ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_status_change();
