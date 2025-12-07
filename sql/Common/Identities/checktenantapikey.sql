create or replace function checkWalletApikey(
    _apikey varchar,
    _ip varchar default '') returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb = '{"statuc":"sucess"}';
    aux numeric;
BEGIN
    select count(*) into aux from identities where apikey = _apikey;
    if (aux = 0) then
        raise exception using detail = 'No ApiKey Found' , errcode = '19001';
    end if;

    select jsonb_agg(t)->0 into _response from (
           select 200 status,'Athenticated' message, tenantid, info  from identities where apikey = _apikey
       ) as t;
    return _response;
END;
$$;

create or replace function checkPlatformApikey(
    _apikey varchar,
    _ip varchar default '') returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb = '{"statuc":"sucess"}';
    aux numeric;
BEGIN
    select count(*) into aux from lcoplatforms where apikey = _apikey;
    if (aux = 0) then
        raise exception using detail = 'No ApiKey Found' , errcode = '19001';
    end if;

    select jsonb_agg(t)->0 into _response from (
       select 200 status,'Athenticated' message, lcoid from lcoplatforms where apikey = _apikey
   ) as t;
    return _response;
END;
$$;
select checkPlatformApikey('0102030405060708')