
CREATE TABLE identities (
  id          UUID           NOT NULL PRIMARY KEY,
  name        VARCHAR(128)   NOT NULL,
  description VARCHAR(1024),
  dob         DATE           NOT NULL,
  created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);
