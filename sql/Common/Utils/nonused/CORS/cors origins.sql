
--Origin list of CORS
create or replace  function origins(
    _data jsonb,
    _params jsonb,
    _operator jsonb) returns jsonb
    language plpgsql
as
$$
DECLARE
    permission jsonb;
    aux numeric;
    u accounts%rowtype;

    _accessaccount varchar;
    _accountid varchar;

    _result text;
BEGIN
    --select checkroleop('originsinfo',_operator) into permission;
    --_accountid := verify_key_exists(_data,'accountid');

    select jsonb_agg(t)   into _result from (
        select a.accountid, o.originid,o.name, o.urlorigin,o.status,
       o.prefix,o.fqdn, c.cdnid,c.originid zonebalancer,
        'http://'||o.fqdn||'/' || trim(o.prefix) cdnpath,
        a.tenantid, p.authmethod, p.publickey, p.privatekey,
        i.identity,a.accountid, ipvalidation,p.expires,
        originsoptions(o.originid) options,
        O.obs,o.secret,to_char(O.created_at,'DD-MM-YYYY HH24:MI') created_at
        from originsources O inner join accounts a on (o.accountid = a.accountid)
        inner join platforms p on a.platformid = p.platformid
        inner join accountaccess a2 on a.accountid = a2.accountid
        inner join identities i on a2.identityid = i.identityid
        inner join cdnaccountlimits c2 on a.accountid = c2.accountid
        inner join cdnurls c on O.originid = c.originid
        where O.status in ( 'enabled', 'waiting')
        and c2.status = 'enabled'
    ) as t;
    if (_result is null) then
        return ('{"status":"success","origins":[]}')::jsonb;
    end if;
    return ('{"status":"success","origins":'|| _result||'}')::jsonb;
  END;
$$;


--Origin list of CORS
create or replace  function originsoptions(
    _originid varchar) returns jsonb
    language plpgsql
as
$$
DECLARE
    j jsonb;
    aux numeric;
    _auxrule text;
    _auxweigth numeric;
    _auxkey jsonb;
    _rule text;
    _result jsonb;
    _secure_key_alone boolean := false;
    _secure_key_present boolean := false;
    _secure_key_in_base boolean := false;
    --_ruleset jsonb = '[]'::jsonb;
    r record;
BEGIN
     select count(*) into aux from originsources where originid = _originid and not (((origindata->>'options')::jsonb->>'secure_key')::jsonb)->>'key' is null;
    if (aux > 0) then
        _secure_key_present := true;
        _secure_key_in_base := true;
    end if;

    select count(*) into aux
     from (select jsonb_array_elements((origindata->>'rules')::jsonb) od  from originsources where originid = _originid) as t
    where  not (((od->>'options')::jsonb->>'secure_key')::jsonb)->>'key' is null;
    if (aux = 0) then
        _secure_key_alone := true; --Also No rules
    else
        for r in select jsonb_array_elements((origindata->>'rules')::jsonb) od  from originsources where originid = _originid --and not (origindata->>'rules')::jsonb->>'secure_key' is null
            loop
            --if (not (r.od->>'options') is null) then
                 _auxrule := replace(r.od->>'rule','\','\\');
                 _auxweigth := r.od->>'weight';
                 _auxkey := ((r.od->>'options')::jsonb)->>'secure_key';
                raise notice 'Values % [%] %',_auxrule,_auxweigth, _auxkey;
                if (not _auxkey is null) then
                    _rule := '{"rule":"'|| _auxrule ||'","weight":'|| _auxweigth ||',"secure_key":'|| _auxkey::text ||'}';
                    raise notice 'rule: %',_rule;
                    --_ruleset := _ruleset ||  _rule::jsonb;
                    _secure_key_present := true;
                end if;
            --end if;
        end loop;
        --raise notice 'ruleset: %',_ruleset;
    end if;

    select jsonb_agg(t)  into _result from (
        select '0' weight, 'all' rule, 'true' active,
            ((origindata->>'options')::jsonb->>'secure_key')::jsonb secure_key,
            origindata->>'originProtocol' originProtocol
        from originsources OS where os.originid = _originid
    union
        select od->>'weight' weight, od->>'rule' rule, od->>'active' active,
            ((od->>'options')::jsonb->>'secure_key')::jsonb secure_key,
             od->>'originProtocol' originProtocol
        from (
            select jsonb_array_elements((origindata->>'rules')::jsonb) od  from originsources
            where originid = _originid
            ) as t
    ) as t;
    if (_result is null) then
        return '[]';
    end if;
     select jsonb_agg(t)->0  into _result from (
        select _secure_key_alone secure_key_alone,
        _secure_key_present secure_key_present, -- _ruleset ruleset,
        _secure_key_in_base secure_key_in_base,
        _result parameters
    ) as t;

    return _result;
  END;
$$;


select count(*)
 from (select jsonb_array_elements((origindata->>'rules')::jsonb) od  from originsources) as t
where  not (((od->>'options')::jsonb->>'secure_key')::jsonb)->>'key' is null;

    select originid, count(*) from originsources where
        ((origindata->>'rules')::jsonb->>'options')::jsonb->>'secure_key'  <> 'null'
        and (origindata->>'rules')::jsonb->>'options' <> '0'
    group by originid;


select originsoptions('cdne.backpanel.net');
select originsoptions('live1.radiosity.sx');

select originsoptions('vod2cdn.radiosity.sx');
select originsoptions('lines.backpanel.net');
select origins('{}','{}','{}');


        select '0' weight,
               ((origindata->>'options')::jsonb->>'secure_key')::jsonb secure_key,
            origindata->>'originProtocol' originProtocol
        from originsources OS
        union
        select od->>'weight' weight,
            ((od->>'options')::jsonb->>'secure_key')::jsonb secure_key,
                    od->>'originProtocol' originProtocol
        from (
            select jsonb_array_elements((origindata->>'rules')::jsonb) od  from originsources
            ) as t;

select jsonb_array_elements((origindata->>'rules')::jsonb) from originsources OS;

/*
En CDNAccountLimits, hay que dejar todo disabled, salgo la CDN por defecto

 */

select info from accounts where accountid = 'gcore:246973';
select origindata from originsources where  originid = 'cdne.backpanel.net';

select originid, origindata->>'rules'
from originsources where  originid = 'cdne.backpanel.net';

select origins('{}','{}','{}');


Options:
"secure_key": { //con IP
            "key": "0102030405060708",
            "type": 0,
            "enabled": true
        },
"secure_key": { //sin IP
            "key": "0102030405060708",
            "type": 2,
            "enabled": true
        },
"country_acl": {
            "enabled": true,
            "policy_type": "deny",
            "excepted_values": ["US", "PR", "PY", "CA", "MX", "DO", "BR", "FR", "ES", "GB", "PA", "SV"]
        },
"user_agent_acl": {
            "enabled": true,
            "policy_type": "allow",
            "excepted_values": ["PostmanRuntime/7.36.0"]
        },
"allowedHttpMethods": {
            "value": ["GET", "POST", "HEAD", "OPTIONS", "PUT", "PATCH", "DELETE"],
            "enabled": true
        },


    "originProtocol": "HTTP",


       select a.accountid, o.originid,o.name, o.urlorigin,o.status,
       o.prefix,o.fqdn, c.cdnid,c.originid zonebalancer,
        'http://'||o.fqdn||'/' || trim(o.prefix) cdnpath,
        a.tenantid, p.authmethod, p.publickey, p.privatekey,
        i.identity,a.accountid, ipvalidation,
        O.obs,o.secret,to_char(O.created_at,'DD-MM-YYYY HH24:MI') created_at,
        (O.origindata->>'options')::jsonb
        from originsources O inner join accounts a on (o.accountid = a.accountid)
        inner join platforms p on a.platformid = p.platformid
        inner join accountaccess a2 on a.accountid = a2.accountid
        inner join identities i on a2.identityid = i.identityid
        inner join cdnaccountlimits c2 on a.accountid = c2.accountid
        inner join cdnurls c on O.originid = c.originid
        where O.status in ( 'enabled', 'waiting')
        and c2.status = 'enabled'

/*
OLD
        select a.accountid, originid,o.name, urlorigin,o.status,
       o.prefix,fqdn,
        'http://'||fqdn||'/' || trim(o.prefix) cdnpath,
        a.tenantid, p.authmethod, p.publickey, p.privatekey,
        i.identity,a.accountid, ipvalidation,
        O.obs,o.secret,to_char(O.created_at,'DD-MM-YYYY HH24:MI') created_at
        from originsources O inner join accounts a on (o.accountid = a.accountid)
        inner join platforms p on a.platformid = p.platformid
        inner join accountaccess a2 on a.accountid = a2.accountid
        inner join identities i on a2.identityid = i.identityid
        where O.status in ( 'enabled', 'waiting') --and a.accountid = _accountid
 */

