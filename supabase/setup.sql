-- ============================================================
-- CHLOE & DYLAN WEDDING PHOTO STORAGE
-- SUPABASE SETUP
-- ============================================================

---

-- 1. CREATE THE PRIVATE STORAGE BUCKET

---

insert into storage.buckets (
id,
name,
public
)
values (
'wedding-photos',
'wedding-photos',
false
)
on conflict (id) do update
set public = false;

---

-- 2. STORAGE POLICIES

---

/*
IMPORTANT:

```
The bucket is PRIVATE.

Guests will NOT be given permission to browse the bucket.

The Edge Function creates temporary signed upload
permissions for individual files instead.
```

*/

-- Remove old policies if this file is run again.

drop policy if exists
"Guests cannot list wedding photos"
on storage.objects;

drop policy if exists
"Guests cannot publicly read wedding photos"
on storage.objects;

---

-- 3. PREVENT PUBLIC LISTING

---

create policy
"Guests cannot list wedding photos"

on storage.objects

for select

to anon

using (
false
);

---

-- 4. PREVENT ANONYMOUS DIRECT ACCESS

---

create policy
"Guests cannot publicly read wedding photos"

on storage.objects

for select

to anon

using (
false
);

-- ============================================================
-- DONE
-- ============================================================

/*
Your storage bucket should now be:

```
    wedding-photos
          |
          └── PRIVATE

Guests:
    ❌ Cannot browse photos
    ❌ Cannot list the album
    ❌ Cannot directly read photos

Our server:
    ✅ Can create signed upload permissions
    ✅ Can manage the private collection
```

*/
