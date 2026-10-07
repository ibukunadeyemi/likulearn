-- Free-trial registrations from the enrolment form.
CREATE TABLE registrations (
  id               TEXT PRIMARY KEY,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  -- new | contacted | trial booked | enrolled | closed
  status           TEXT NOT NULL DEFAULT 'new',
  parent_name      TEXT NOT NULL,
  parent_email     TEXT NOT NULL,
  parent_phone     TEXT NOT NULL,
  timezone         TEXT NOT NULL,
  plan             TEXT NOT NULL,
  children_count   INTEGER NOT NULL,
  children_json    TEXT NOT NULL,
  children_summary TEXT NOT NULL,
  -- Salted hash of the sender's IP, only used to rate-limit abuse. Never the raw IP.
  ip_hash          TEXT,
  team_notes       TEXT NOT NULL DEFAULT ''
);
CREATE INDEX registrations_created_at ON registrations (created_at);
CREATE INDEX registrations_email ON registrations (parent_email, created_at);
CREATE INDEX registrations_ip ON registrations (ip_hash, created_at);

-- Newsletter signups from the footer.
CREATE TABLE subscribers (
  email      TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
