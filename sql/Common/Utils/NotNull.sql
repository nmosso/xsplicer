
create or replace function textnotnull(
    _value varchar) returns text
    language plpgsql
as
$$
DECLARE

BEGIN
    if (_value is null) then
        return '';
    end if;
    return _value;
END;
$$;
