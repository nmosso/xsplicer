
create or replace function function(
    _data jsonb,
    _params jsonb,
    _operator jsonb
    ) returns jsonb
    language plpgsql
as
$$
DECLARE
    permission jsonb;
    _response jsonb = '{"status":"success"}';
    aux numeric;
BEGIN
    select checkroleop('function',_operator) into permission;

    select count(*) into aux; -- from table where aux = _aux;
    if (aux = 0) then
        raise exception using detail = '' , errcode = '11001';
    end if;

    select jsonb_agg(t) into _response from (
        select 1
    ) as t;
    return _response;
END;
$$;
