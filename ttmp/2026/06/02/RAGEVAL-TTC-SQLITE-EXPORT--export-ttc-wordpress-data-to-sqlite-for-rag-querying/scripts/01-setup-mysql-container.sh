#!/usr/bin/env bash
set -euo pipefail

# Load the TTC WordPress development dump into a local MySQL 8 container.
# The script is idempotent for an already-running container named rageval-ttc-mysql.

CONTAINER_NAME="${CONTAINER_NAME:-rageval-ttc-mysql}"
MYSQL_DATABASE="${MYSQL_DATABASE:-ttc}"
MYSQL_USER="${MYSQL_USER:-ttc}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-ttc}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-somewordpress}"
MYSQL_PORT="${MYSQL_PORT:-3347}"
DUMP_PATH="${DUMP_PATH:-/home/manuel/code/ttc/ttc/ttc_dev_dump.sql.bz2}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if [[ ! -f "$DUMP_PATH" ]]; then
  echo "dump not found: $DUMP_PATH" >&2
  exit 1
fi

if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "container already running: $CONTAINER_NAME"
else
  if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    echo "starting existing container: $CONTAINER_NAME"
    docker start "$CONTAINER_NAME" >/dev/null
  else
    echo "creating mysql container: $CONTAINER_NAME"
    docker run -d \
      --name "$CONTAINER_NAME" \
      -e MYSQL_DATABASE="$MYSQL_DATABASE" \
      -e MYSQL_USER="$MYSQL_USER" \
      -e MYSQL_PASSWORD="$MYSQL_PASSWORD" \
      -e MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" \
      -p "$MYSQL_PORT:3306" \
      mysql:8.0 >/dev/null
  fi
fi

echo "waiting for mysql to accept connections..."
until docker exec "$CONTAINER_NAME" mysqladmin ping -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --silent >/dev/null 2>&1; do
  sleep 2
done

POST_COUNT=$(docker exec "$CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -N -B "$MYSQL_DATABASE" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='wp_posts';" 2>/dev/null || echo 0)
if [[ "$POST_COUNT" == "1" ]]; then
  ROWS=$(docker exec "$CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -N -B "$MYSQL_DATABASE" -e "SELECT COUNT(*) FROM wp_posts;" 2>/dev/null || echo 0)
  if [[ "$ROWS" != "0" ]]; then
    echo "wp_posts already loaded ($ROWS rows); skipping import"
    exit 0
  fi
fi

echo "importing $DUMP_PATH into $MYSQL_DATABASE (this can take a few minutes)..."
bzip2 -dc "$DUMP_PATH" | docker exec -i "$CONTAINER_NAME" mysql \
  -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  --default-character-set=utf8mb4 \
  "$MYSQL_DATABASE"

docker exec "$CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e \
  "SELECT COUNT(*) AS posts FROM wp_posts; SELECT post_type, post_status, COUNT(*) AS c FROM wp_posts GROUP BY post_type, post_status ORDER BY c DESC LIMIT 20;"
