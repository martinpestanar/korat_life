-- Migration to fix ON CONFLICT statement in generate_daily_blocks to match partial unique index.
-- Applied on 2026-05-27

CREATE OR REPLACE FUNCTION public.generate_daily_blocks(target_date date)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  day_of_week INT;
  d_type day_type_enum;
BEGIN
  IF EXISTS (SELECT 1 FROM daily_blocks WHERE date = target_date) THEN
    RETURN;
  END IF;

  day_of_week := EXTRACT(ISODOW FROM target_date);
  
  IF day_of_week <= 5 THEN
    d_type := 'weekday';
  ELSIF day_of_week = 6 THEN
    d_type := 'saturday';
  ELSE
    d_type := 'sunday';
  END IF;

  INSERT INTO daily_blocks (date, template_id, period, start_time, end_time, title, pillar_id, notes)
  SELECT 
    target_date, 
    id, 
    period, 
    start_time, 
    end_time, 
    title,
    pillar_id,
    notes
  FROM block_templates
  WHERE day_type = d_type
  ON CONFLICT (date, template_id) WHERE template_id IS NOT NULL DO NOTHING;

  -- Rollover pending subtasks (is_completed = false) from previous days' blocks
  -- to today's corresponding blocks (matching template_id)
  CREATE TEMP TABLE moved_subtasks AS
  SELECT s.id AS subtask_id, new_db.id AS new_block_id, old_db.id AS old_block_id
  FROM subtasks s
  JOIN daily_blocks old_db ON s.daily_block_id = old_db.id
  JOIN daily_blocks new_db ON old_db.template_id = new_db.template_id
  WHERE old_db.date < target_date
    AND new_db.date = target_date
    AND s.is_completed = false;

  -- Update the subtasks to today's block
  UPDATE subtasks
  SET daily_block_id = m.new_block_id
  FROM moved_subtasks m
  WHERE subtasks.id = m.subtask_id;

  -- Recalculate completion for the old blocks that had subtasks moved
  UPDATE daily_blocks db
  SET completion_percentage = CASE 
        WHEN (SELECT COUNT(*) FROM subtasks WHERE daily_block_id = db.id) = 0 THEN 0
        ELSE (SELECT (COUNT(*) FILTER (WHERE is_completed = true) * 100) / COUNT(*) FROM subtasks WHERE daily_block_id = db.id)
      END,
      is_completed = CASE
        WHEN (SELECT COUNT(*) FROM subtasks WHERE daily_block_id = db.id) = 0 THEN false
        ELSE (SELECT COUNT(*) = COUNT(*) FILTER (WHERE is_completed = true) FROM subtasks WHERE daily_block_id = db.id)
      END
  WHERE db.id IN (SELECT old_block_id FROM moved_subtasks);

  -- Clean up temp table
  DROP TABLE moved_subtasks;
END;
$function$;
