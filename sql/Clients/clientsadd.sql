select * from clients;

rollback;
select clientsadd('{"tenantid":"null","plan":"Basico","username":"nmosso","password":"daniel","account":"null","name":"null",
  "lastname":"null","email":"sa","phone":"null","location":"null","info":"{}","maxdevices":"1","obs":"null",
  "status":"enabled","istrial":"false","expiration":"Sun Jul 14 2024 12:02:56"}',
                  '{}','{"apikey":"655e9e9c-92a4-4c12-be90-990a5705a896"}');

rollback;
begin transaction;
select clientsadd('{"tenantid":"Local","plan":"Basico","username":"01020304","password":"01020304","account":"","name":"Nicolas Mosso","lastname":"","email":"nmosso@gmail.com","phone":"0981557430","location":"","maxdevices":"1","obs":"","istrial":"false","expiration":"2024-07-31"}',
                  '{}','{"apikey":"655e9e9c-92a4-4c12-be90-990a5705a896"}');



select clientsadd('{}','{}','{}');

rollback;
create or replace function clientsadd(
    _data jsonb,
    _params jsonb,
    _operator jsonb
) returns jsonb
    language plpgsql
as
$$
DECLARE

    _clientid numeric;
    _status varchar;
    _info jsonb ='{}';
    aux numeric;
BEGIN
    _status = jgk(_data,'status','enabled');
    _clientid := jgkn(_data,'clientid');
    _info = jgkj(_data,'info','{}');
    if (_info is null) then
        _info = ('{}');
    end if;

    select count(*) into aux from clients where username = trim(_data->>'username');
    if (aux > 0) then
        raise exception using detail = 'Username already exists' , errcode = '11003';
    end if;

    IF (trim(_data->>'username') = '') THEN
        RAISE EXCEPTION USING DETAIL = 'Username is empty', errcode = '11001';
    END IF;
    IF (trim(_data->>'password') = '') THEN
        RAISE EXCEPTION USING DETAIL = 'Password is empty', errcode = '11002';
    END IF;

    IF (length(trim(_data->>'username'))< 4 ) THEN
        RAISE EXCEPTION USING DETAIL = 'Invalid username length', errcode = '11006';
    END IF;
    IF (length(trim(_data->>'password'))< 4 ) THEN
        RAISE EXCEPTION USING DETAIL = 'Invalid password length', errcode = '11007';
    END IF;
    INSERT INTO clients (
        tenantid,
        plan,
        username,
        password,
        account,
        name,
        lastname,
        email,
        phone,
        location,
        info,
        maxdevices,
        obs,
        status,
        istrial,
        expiration, created_by, created_at
    ) VALUES (
                 trim(_data->>'tenantid'),
                 trim(_data->>'plan'),
                 trim(_data->>'username'),
                 trim(_data->>'password'),
                 trim(_data->>'account'),
                 trim(_data->>'name'),
                 trim(_data->>'lastname'),
                 trim(_data->>'email'),
                 trim(_data->>'phone'),
                 trim(_data->>'location'),
                 (_info)::jsonb,
                 (_data->>'maxdevices')::numeric,
                 trim(_data->>'obs'),
                 _status,
                 (_data->>'istrial')::boolean,
                 (_data->>'expiration')::timestamp with time zone,
                 _operator,current_timestamp
             );


    return ('{"status":"success"}')::jsonb;
END;
$$;

rollback;
create or replace function clientsupdate(
    _data jsonb,
    _params jsonb,
    _operator jsonb
) returns jsonb
    language plpgsql
as
$$
DECLARE

    _clientid numeric;
    _status varchar;
    _info jsonb;
    aux numeric;
    _oldusername varchar;
BEGIN
    _status = jgk(_data,'status','enabled');
    _clientid := jgkn(_data,'clientid');
    _info = jgkj(_data,'info','{}');
    if (_info is null) then
        _info = ('{}');
    end if;
    select count(*) into aux from clients where clientid = _clientid;
    if (aux = 0) then
        raise exception using detail = 'Client not exists' , errcode = '11004';
    end if;

    IF (trim(_data->>'username') = '') THEN
        RAISE EXCEPTION USING DETAIL = 'Username is empty', errcode = '11001';
    END IF;
    IF (trim(_data->>'password') = '') THEN
        RAISE EXCEPTION USING DETAIL = 'Password is empty', errcode = '11002';
    END IF;

    IF (length(trim(_data->>'username'))< 6 ) THEN
        RAISE EXCEPTION USING DETAIL = 'Invalid username length', errcode = '11006';
    END IF;
    IF (length(trim(_data->>'password'))< 6 ) THEN
        RAISE EXCEPTION USING DETAIL = 'Invalid password length', errcode = '11007';
    END IF;
    select username into _oldusername from clients where clientid = _clientid;

    if (trim(_data->>'username') <> _oldusername) then
        select count(*) into aux from clients where username = trim(_data->>'username') and clientid <> _clientid;
        if (aux > 0) then
            raise exception using detail = 'Username already taked' , errcode = '11003';
        end if;
    end if;


    UPDATE clients SET
                       tenantid = trim(_data->>'tenantid'),
                       plan = trim(_data->>'plan'),
                       username = trim(_data->>'username'),
                       password = trim(_data->>'password'),
                       account = trim(_data->>'account'),
                       name = trim(_data->>'name'),
                       lastname = trim(_data->>'lastname'),
                       email = trim(_data->>'email'),
                       phone = trim(_data->>'phone'),
                       location = trim(_data->>'location'),
                       info = (_info)::jsonb,
                       maxdevices = (_data->>'maxdevices')::numeric,
                       obs = trim(_data->>'obs'),
                       status = _status,
                       istrial = (_data->>'istrial')::boolean,
                       expiration = (_data->>'expiration')::timestamp with time zone,
                       modified_at = current_timestamp,
                       modified_by = _operator
    WHERE clientid = _clientid;

    return ('{"status":"success"}')::jsonb;
END;
$$;
