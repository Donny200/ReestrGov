set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE adlita_project1;
    CREATE DATABASE reference_service_db;
    CREATE DATABASE function_catalog_db;
EOSQL
