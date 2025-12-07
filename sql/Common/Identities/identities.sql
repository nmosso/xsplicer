drop function identityauthorise(_clientid character varying, _password varchar) ;

select identityauthorise('01020304-05060708','af56af662d992');
select * from identities;


create or replace function identityauthorise(_identityid character varying, _password varchar) returns varchar
    language plpgsql
as
$$
DECLARE
    _response jsonb;
    _paymentxid varchar;
    _end varchar;
    aux numeric;
BEGIN
    _identityid := trim(_identityid);


    select count(*) into aux from identities where identityid = _identityid;
    if (aux = 0) THEN
        raise exception using detail = 'Invalid Client' , errcode = '13001';
    end if;

    select count(*) into aux from identities
    where identityid = _identityid and password = _password
        and status = 'enabled';
    if (aux = 0) THEN
        raise exception using detail = 'Client not enabled' , errcode = '13002';
    end if;

    _response := ('{"identityid":"'|| _identityid ||'"}')::jsonb;

    return _response;
END;
$$;


create or replace function identityexists(_identityid character varying) returns varchar
    language plpgsql
as
$$
DECLARE
    _response jsonb;
    _paymentxid varchar;
    _end varchar;
    aux numeric;
BEGIN
    _identityid := trim(_identityid);


    select count(*) into aux from identities where identityid = _identityid;
    if (aux = 0) THEN
        raise exception using detail = 'Invalid Client' , errcode = '13001';
    end if;

    select count(*) into aux from identities
    where identity->>'identityid' = _identityid --and identity->>'secret' = _password
        and status = 'enabled';
    if (aux = 0) THEN
        raise exception using detail = 'Client not enabled' , errcode = '13002';
    end if;

    _response := ('{"identityid":"'|| _identityid ||'"}')::jsonb;

    return _response;
END;
$$;

rollback;
create or replace function identityadd(
    _data jsonb,
    _params jsonb,
    _operator jsonb) returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb;
    _identityid varchar;
    _email varchar;
    _domain varchar;
    _password varchar;
    _username varchar;
    _name varchar;
    aux numeric;
    _identity jsonb;
BEGIN
    _email := verify_key_exists(_data,'email');
    _domain := verify_key_exists(_params,'domain');
    _password := verify_key_exists(_data,'password');
    _password = md5('myPass'|| trim(_password));
    if (key_exists(_data,'username') is true) then
        _username := verify_key_exists(_data,'username');
    else
        _username := _email;
    end if;
    _name := jgk(_data,'name','');

    select count(*) into aux from identities where email  = _email and domain = _domain;
    if (aux > 0) then
        raise exception using detail = 'Email already registered', errcode = '12010';
    end if;
    select count(*) into aux from identities where username  = _username and domain = _domain;
    if (aux > 0) then
        raise exception using detail = 'Username already taken', errcode = '12011';
    end if;

    select jsonb_agg(t) into _identity from (
        select _name name, _email email, _username username, current_timestamp created_at
    ) as t;
    _identityid = gen_random_uuid();
    insert into identities (identityid, email, username, password, identitysignature, identity, prelabel, domain,secondfa) values (
          _identityid,_email,_username,_password,'',_identity,'',_domain,'enabled'
     );

    _response := ('{"status":"sucess","identityid":"'||_identityid||'"}')::jsonb;

    return _response;
END;
$$;
