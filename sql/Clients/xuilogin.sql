
select xuilogin('{"username":"nmosso","password":"daniel"}','{}','{}');

create or replace function xuilogin(_data jsonb,_params jsonb,_operator jsonb) returns jsonb
    language plpgsql
as
$$
DECLARE
    _response jsonb;
    _username varchar;
    _password varchar;
    aux numeric;
    user_info jsonb;
    server_info jsonb;
    _clientserver varchar;
    _clientport numeric;
BEGIN
    _username = trim(get_key_exists(_data,'username'));
    _password =trim(get_key_exists(_data,'password'));

    select value into _clientserver from params where paramid = 'clientserver';
    select value::numeric into _clientport from params where paramid = 'clientport';

    select count(*) into aux from clients where username = _username and password = _password;
    if (aux = 0) THEN
        raise exception using detail = 'Client not enabled' , errcode = '13002';
    end if;

    select json_agg(t)->0 into user_info from (
          select username, password,
                 'IPTV Server' message,
                 1 auth,
                 substatus status,
                 round(extract(epoch from expiration),0)::text exp_date,
                 0::text is_trial,
                 0::text active_cons,
                 round(extract(epoch from created_at),0)::text created_at,
                 maxdevices::text max_connections,
                 ('["m3u8"]')::jsonb allowed_output_formats
          from clients where username = _username
       ) as t;

    select json_agg(t)->0 into server_info from (
    select
        --true xui,
        --'1.5.12' version,
        -- 2 revision,
        _clientserver url, --_clientserver|| ':'|| _clientport::text url,
        _clientport::text port,
        null https_port,
        'http' server_protocol,
        9999::text rtmp_port,
        round(extract(epoch from current_timestamp),0) timestamp_now,
        to_char(current_timestamp,'YYYY-MM-DD HH24:MI:SS') time_now,
       ('America\/Argentina\/Buenos_Aires')::text timezone
    ) as t;
    _response = ('{"user_info":'|| user_info::text||',"server_info":'|| server_info::text||'}')::jsonb;
    return _response;
END;
$$;

