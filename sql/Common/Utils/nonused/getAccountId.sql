
create or replace function getaccountid(
    _params jsonb) returns text
    language plpgsql
as
$$
DECLARE
    _accessaccount varchar;
    _accountid varchar;
    aux numeric;
BEGIN
    _accessaccount := verify_key_exists(_params,'identityid');

    select count(*) into aux from accountaccess where identityid = _accessaccount;
    if (aux = 0) then
        raise exception using detail = 'Account not enabled for this operation', errcode = '12001';
    end if;
    select accountid into _accountid from accountaccess where identityid = _accessaccount;
    return _accountid;
END;
$$;

