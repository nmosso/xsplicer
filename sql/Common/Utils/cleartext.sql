create or replace function cleartext(
    _text text) returns text
    language plpgsql
as
$$
DECLARE
    _aux text = '';
BEGIN
    _aux = replace(replace(replace(_text,'''',''),'"',''),'`','');
    return _aux;
END;
$$;
