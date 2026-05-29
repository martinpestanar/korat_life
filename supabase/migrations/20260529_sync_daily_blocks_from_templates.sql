-- Function to sync daily_blocks of a given date with current block_templates data
-- This ensures that if a template is updated, the corresponding daily_block is also updated.

CREATE OR REPLACE FUNCTION public.sync_daily_blocks_from_templates(target_date date)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update existing daily_blocks for the given date to match their current template data
  UPDATE daily_blocks db
  SET
    title       = bt.title,
    start_time  = bt.start_time,
    end_time    = bt.end_time,
    notes       = bt.notes,
    pillar_id   = bt.pillar_id,
    period      = bt.period
  FROM block_templates bt
  WHERE db.template_id = bt.id
    AND db.date = target_date;
END;
$function$;
