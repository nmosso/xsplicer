select verify_key_exists('{"username": "nicolas"}','username');

create or replace function verify_key_exists(some_json jsonb, outer_key text) returns text
      language plpgsql
as
$$
BEGIN
    if (not key_exists(some_json,outer_key)) then
        raise exception using detail = 'Key '|| outer_key ||' not exits.', errcode = '13001';
    else
        return some_json->>outer_key;
    end if;
END;
$$;

create or replace function jgk(some_json jsonb, outer_key text, defvalue text default null) returns text
      language plpgsql
as
$$
BEGIN
    --JsonGetKey
    if (not key_exists(some_json,outer_key)) then
        return defvalue;
    else
        return some_json->>outer_key;
    end if;
END;
$$;

create or replace function jgkb(some_json jsonb, outer_key text, defvalue boolean default false) returns text
      language plpgsql
as
$$
BEGIN
    --JsonGetKey
    if (not key_exists(some_json,outer_key)) then
        return defvalue;
    else
        return some_json->>outer_key;
    end if;
END;
$$;

create or replace function jgkn(some_json jsonb, outer_key text, defvalue numeric default null) returns numeric
      language plpgsql
as
$$
BEGIN
    --JsonGetKey
    if (not key_exists(some_json,outer_key)) then
        return defvalue;
    else
        return some_json->>outer_key;
    end if;
END;
$$;

create or replace function jgkj(some_json jsonb, outer_key text, defvalue jsonb default null) returns jsonb
      language plpgsql
as
$$
BEGIN
    --JsonGetKey
    if (not key_exists(some_json,outer_key)) then
        return defvalue;
    else
        return some_json->>outer_key;
    end if;
END;
$$;

create or replace function get_key_exists(some_json jsonb, outer_key text, defvalue text default null) returns text
      language plpgsql
as
$$
BEGIN
    if (not key_exists(some_json,outer_key)) then
        return defvalue;
    else
        return some_json->>outer_key;
    end if;
END;
$$;

create or replace function  key_exists(some_json jsonb, outer_key text) returns boolean
      language plpgsql
as
$$
BEGIN
    RETURN (some_json->outer_key) IS NOT NULL;
END;
$$;

