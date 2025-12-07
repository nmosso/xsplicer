create or replace function hashpassword(data character varying) returns character varying
    language plpgsql
as
$$
DECLARE
    --create extension pgcrypto;
  aux varchar;
BEGIN
    select replace(replace(replace(encode(digest('salt_hashed'||data,'sha256'),'base64'),'==',''),'/', '_'),'+', '-') into aux;
  return trim(aux);
END;
$$;

create or replace function hashdata(data character varying) returns character varying
    language plpgsql
as
$$
DECLARE
    --create extension pgcrypto;
  aux varchar;
BEGIN
    select encode(digest('salt_hashed'||data,'sha1'),'hex') into aux;
  return trim(aux);
END;
$$;

create or replace function randtext(data character varying default '', len numeric default 5) returns character varying
    language plpgsql
as
$$
DECLARE
    --create extension pgcrypto;
    aux varchar;
BEGIN
    select chr(ascii('a') + (random() * 25)::integer) into aux;
    if (len <= 1) then
        return trim(data || aux);
    end if;

    return randtext(data || aux,len-1);
END;
$$;


select randtext('pcx',5);

select chr(ascii('a') + (random() * 25)::integer)