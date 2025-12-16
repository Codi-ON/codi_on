select count(*) from clothing_item;

select *
from clothing_item
where suitable_min_temp <= 10
  and suitable_max_temp >= 10
  and category = 'OUTER'
order by selected_count desc, id desc
limit 20;