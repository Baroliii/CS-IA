create table news (
  id text primary key,
  tag text not null default '',
  title text not null,
  date_label text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table sponsors (
  id text primary key,
  name text not null,
  tier text not null check (tier in ('Title Partner','Principal Partners','Technical Partners')),
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
create table login_attempts (
  ip text primary key,
  fails integer not null default 0,
  locked_until timestamptz
);
alter table news enable row level security;
alter table sponsors enable row level security;
alter table login_attempts enable row level security;
 
insert into news (id, tag, title, date_label, created_at) values
 ('n1','Feature','VD-26 aerodynamic package unveiled — a season-defining upgrade','15 May 2026','2026-05-15'),
 ('n2','Technical','Our CFD simulation pipeline: how we cut drag by 8%','10 May 2026','2026-05-10'),
 ('n3','Announcement','Veloce Dynamics announces new title partner for 2026 season','3 May 2026','2026-05-03'),
 ('n4','Race Report','P2 at the Northern Invitational — debrief and data breakdown','28 Apr 2026','2026-04-28'),
 ('n5','STEM Outreach','School visit programme: inspiring the next generation of engineers','20 Apr 2026','2026-04-20');
insert into sponsors (id, name, tier, sort) values
 ('s1','Your Brand Here','Title Partner',1),
 ('s2','Partner A','Principal Partners',2),('s3','Partner B','Principal Partners',3),('s4','Partner C','Principal Partners',4),
 ('s5','Tech Co.','Technical Partners',5),('s6','Materials Ltd','Technical Partners',6),
 ('s7','CAD Tools','Technical Partners',7),('s8','Electronics','Technical Partners',8);
 
