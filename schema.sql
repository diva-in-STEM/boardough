DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS dashboards;
DROP TABLE IF EXISTS sources;
DROP TABLE IF EXISTS subroutes;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE sources (
  created_by INTEGER NOT NULL,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL,
  route TEXT NOT NULL,
  PRIMARY KEY (name, created_by),
  FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE dashboards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_by INTEGER NOT NULL,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_created_by INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (source_name, source_created_by) REFERENCES sources (name, created_by)
);

CREATE TABLE subroutes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_created_by INTEGER NOT NULL,
  FOREIGN KEY (source_name, source_created_by) REFERENCES sources (name, created_by)
);