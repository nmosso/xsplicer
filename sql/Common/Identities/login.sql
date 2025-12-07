select md5('rsPass'|| trim('admin'));

select identitieslogin('{"email":"admin@site.com","password":"admin","iat":1709469036,"epx":1709483436}','{"apikey":"23245-5352-002"}','{"operator":"System","ip":"::1"}')


create or replace  function identitieslogin(
    _data jsonb,
    _params jsonb,
    _operator jsonb) returns jsonb
    language plpgsql
as
$$
DECLARE
    permission jsonb;
    aux numeric;

    _accountid varchar;
    _obs text;

    _email varchar;
    _domain varchar;
    _password varchar;
    _iat numeric;
    _exp numeric;
    _jwt varchar;

    _info jsonb;
BEGIN
    select checkroleop('identitieslogin',_operator) into permission;

     raise notice  '1';

    _iat := to_number(verify_key_exists(_data,'iat'),'9999999999999999');
    _exp := _iat + 4*60*60;
    _domain := verify_key_exists(_operator,'domain');
    _email := verify_key_exists(_data,'email');
    _password := verify_key_exists(_data,'password');
    _password = md5('rsPass'|| trim(_password));
    raise notice  '2: [%] [%] {%}', _email, _password,_iat;
    select count(*) into aux from identities where email  = _email and domain = _domain;
    if (aux = 0) then
        raise exception using detail = 'Username not found', errcode = '12010';
    end if;
    raise notice  '3';
    select count(*) into aux from identities where email = _email  and domain = _domain and status in ('enabled');
    if (aux = 0) then
        raise exception using detail = 'User not enabled', errcode = '12011';
    end if;
    raise notice  '4';
    select count(*) into aux from identities where email = _email and password =_password  and domain = _domain;
    if (aux = 0) then
        raise exception using detail = 'Username or password mismatch', errcode = '12011';
    end if;

    select jsonb_agg(t)->0 into _info from (
        select I.identityid yid, roleid role, email, username un,ac.walletid wll, domain, emailverified, telegramverified, i.status
        from identities I inner join walletaccess ac  on I.identityid = ac.identityid
        where email = _email  and domain = _domain
    ) as t;
    raise notice 'info [%]',_info;
    _info := _info || ('{"iat":'|| _iat||'}')::jsonb;
    _info := _info || ('{"exp":'|| _exp||'}')::jsonb;

    return _info;
  END;
$$;



select identitieslogin('{"password": "daniel", "email": "nmosso@gmail.com","iat":16889785652 }',
'{}','{}');

select md5('myPass'|| trim('daniel'));

select *   from identities where identity->>'username' = 'info@multitenant.pro';