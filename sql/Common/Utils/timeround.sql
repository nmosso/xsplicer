select current_timestamp,
       secondsround(trunc(extract(epoch from current_timestamp))),
       secondsround(trunc(extract(epoch from current_timestamp)),60);

create or replace function secondsround(instant numeric(10), _offset numeric(10) default 0) returns text as
$$
declare
  ts timestamp with time zone;
  result numeric(10);
begin
  raise notice 'values % % %', instant, _offset, instant- _offset;
  ts := to_timestamp(instant - _offset);

  result := trunc(extract(epoch from ts),0) - trunc(extract('second' from ts));
  return result;
end;
$$ language plpgsql;