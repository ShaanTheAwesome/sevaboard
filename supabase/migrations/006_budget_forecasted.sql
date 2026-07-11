-- Add an optional forecasted amount to budget entries, independent of the
-- actual amount/TBA field. Lets the team record a best-guess estimate for
-- any line item (confirmed or not) alongside the real figure.
ALTER TABLE budget_entries ADD COLUMN forecasted_amount numeric(10, 2);
