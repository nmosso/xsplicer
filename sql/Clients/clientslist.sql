select clientslist('{}','{}','{}');
select * from clients;


rollback;
create or replace function clientslist(
    _data jsonb,
    _params jsonb,
    _operator jsonb
) returns jsonb
    language plpgsql
as
$$
DECLARE

    _clientid numeric;
    _tenantid varchar;
    _clients jsonb;
BEGIN
    _clientid := jgkn(_params,'clientid');
    select json_agg(t) into _clients from (
      select clientid, tenantid, plan, username, password, account, name, lastname, email, phone, location, info, maxdevices, obs, status, istrial, substatus,
             to_char(expiration,'YYYY-MM-DD') expiration
      from clients
          where case when _clientid is null then true else clientid = _clientid end
      --limit 1
  ) as t;
    if (_clients is null) then
        _clients = '[]';
    end if;
    --return _clients;
    return ('{"clients":'|| _clients::text ||'}')::jsonb;
END;
$$;

