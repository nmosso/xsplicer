
create or replace  function checkroleop(
    _function varchar,
    _operator jsonb)returns jsonb
    language plpgsql
as

$$
DECLARE
    aux numeric;
BEGIN
    return ('{"status":"sucess"}')::jsonb;
  END;
$$;