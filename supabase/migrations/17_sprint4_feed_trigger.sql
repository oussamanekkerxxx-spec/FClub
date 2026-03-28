-- Sprint 4: Auto-create a feed event when a skill is published

CREATE OR REPLACE FUNCTION public.create_feed_event_on_skill()
RETURNS trigger AS $$
DECLARE
  teacher_name text;
BEGIN
  SELECT first_name INTO teacher_name FROM public.profiles WHERE id = NEW.teacher_id;
  INSERT INTO public.feed_events (member_id, skill_id, type, title, subtitle)
  VALUES (
    NEW.teacher_id,
    NEW.id,
    'new_skill',
    COALESCE(teacher_name, 'Someone') || ' is now teaching ' || NEW.title,
    NEW.category
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_skill_published ON public.skills;
CREATE TRIGGER on_skill_published
  AFTER INSERT ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.create_feed_event_on_skill();
