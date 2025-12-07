

create or replace  function getplatforms() returns jsonb
    language plpgsql
as
$$
DECLARE
    _result jsonb;

BEGIN
    select jsonb_agg(t) into _result from (
      select 1
  ) as t;
    raise notice '%',_result;
    if (_result is null) then
        return ('{"status":"success","platforms":[]}')::jsonb;
    end if;
    return ('{"status":"success","platforms":'|| _result::text||'}')::jsonb;
END;
$$;

select getplatforms();

CREATE or replace FUNCTION platforms_after_all_notice() RETURNS TRIGGER AS $$
BEGIN
    NOTIFY registry, 'update:platforms';
    raise notice 'update:platforms';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


create trigger getplatforms_trigger after insert or update or delete
    on tenants FOR EACH ROW EXECUTE PROCEDURE platforms_after_all_notice();
