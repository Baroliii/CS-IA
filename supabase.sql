-- Run once in Supabase: SQL Editor -> New query -> paste -> Run
create table products (
  id text primary key,
  name text not null,
  category text not null check (category in ('Apparel','Accessories','Stickers')),
  price_pence integer not null check (price_pence between 50 and 100000),
  stock_status text not null default 'In Stock',
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
-- RLS on with no policies: the public anon key can read nothing.
-- Only our server functions (service key) can touch this table.
alter table products enable row level security;

insert into products (id, name, category, price_pence, stock_status, sort) values
 ('p1','Team Race Tee','Apparel',2200,'In Stock',1),
 ('p2','Pit Crew Cap','Apparel',1600,'In Stock',2),
 ('p3','VD-26 Team Jacket','Apparel',5800,'In Stock',3),
 ('p4','Laptop Sticker Pack','Accessories',600,'In Stock',4),
 ('p5','Steel Water Bottle','Accessories',1400,'In Stock',5),
 ('p6','VD Lanyard','Accessories',800,'In Stock',6),
 ('p7','Logo Sticker','Stickers',300,'In Stock',7),
 ('p8','Race Weekend Hoodie','Apparel',4500,'Low Stock',8);
