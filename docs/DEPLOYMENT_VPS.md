# Deployment: Next.js + Directus on VPS

This guide describes how to migrate the project from a local setup to a VPS (Ubuntu 22.04+). The stack is a Next.js frontend (Node 20+) and a self-hosted Directus instance backed by PostgreSQL.

## 1. VPS prerequisites
- SSH access with sudo privileges (example: Ubuntu 22.04 LTS).
- DNS records or public IP reachable from the Internet (`app.domain.tld`, `api.domain.tld`).
- Open ports: 80/443 (HTTP/S). Optionally expose 8055 (Directus) and 3000 (Next.js) during tests.
- Recommended baseline packages:
  ```bash
  sudo apt update && sudo apt upgrade -y
  sudo apt install -y curl git ufw

  # Node LTS + pnpm via corepack
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs build-essential
  sudo corepack enable
  sudo corepack prepare pnpm@latest --activate

  # Process manager for the Next.js runtime
  sudo npm install -g pm2
  ```

## 2. Directus preparation
### 2.1 Directory layout
```bash
sudo mkdir -p /opt/directus/{config,uploads}
sudo chown -R $USER:$USER /opt/directus
cd /opt/directus
```

### 2.2 Environment file
Create `/opt/directus/.env` with production values:
```bash
PORT=8055
PUBLIC_URL=https://api.domain.tld
KEY=replace-with-private-key
SECRET=replace-with-jwt-secret
LOG_LEVEL=info
DB_CLIENT=postgres
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=strong-password
ADMIN_EMAIL=admin@domain.tld
ADMIN_PASSWORD=strong-password
WEBSOCKETS_ENABLED=true
STORAGE_LOCATIONS=local
STORAGE_LOCAL_ROOT=/directus/uploads
SERVICE_TOKEN=replace-with-service-token
```
> Generate a brand new `SERVICE_TOKEN` for production. Never reuse the token from `.env.local`.

### 2.3 Docker Compose
`/opt/directus/docker-compose.yml`:
```yaml
version: "3.8"
services:
  directus:
    image: directus/directus:10
    env_file: .env
    depends_on:
      - postgres
    ports:
      - "8055:8055"
    volumes:
      - ./uploads:/directus/uploads
      - ./config:/directus/config
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: directus
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: strong-password
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
```

Start the stack:
```bash
docker compose pull
docker compose up -d
```

### 2.4 Baseline Directus configuration
Once Directus is reachable (`https://api.domain.tld/admin`):
1. Sign in with the admin credentials created in `.env`.
2. Create a `Public` role with read access on the collections required by the frontend: `forum_cat`, `forum_topicos`, `noticias`, etc.
3. In **Settings → Global → CORS**, whitelist the frontend origin (`https://app.domain.tld`).
4. Create a **service token** dedicated to the Next.js app and copy its value for the frontend `.env`.

### 2.5 Data migration (local → VPS)
On the local Directus instance:
```bash
npm install -g @directus/cli
directus schema snapshot ./snapshot.yaml
directus schema apply --data --output ./seed.zip
```
Copy `snapshot.yaml` and `seed.zip` to `/opt/directus` on the VPS, then apply:
```bash
directus schema apply ./snapshot.yaml
directus schema apply ./snapshot.yaml --data ./seed.zip
```
For large datasets, prefer PostgreSQL dumps (`pg_dump` / `pg_restore`) instead of the CLI export. Double-check category/topic IDs (`forum_cat`, `forum_topicos`) after import.

## 3. Next.js deployment
### 3.1 Clone and install
```bash
cd /var/www
git clone https://github.com/<your-account>/habbone-admin.git
cd habbone-admin/habbonedirectus
pnpm install --frozen-lockfile
```

### 3.2 Production environment file
Create `/var/www/habbone-admin/habbonedirectus/.env.production`:
```bash
NODE_ENV=production
NEXT_PUBLIC_DIRECTUS_URL=https://api.domain.tld
DIRECTUS_SERVICE_TOKEN=<service-token-generated-on-vps>
USERS_TABLE=usuarios
NEXTAUTH_URL=https://app.domain.tld
NEXTAUTH_SECRET=<openssl-rand-hex-64>
HABBO_API_BASE=https://www.habbo.fr
ADMIN_NICKS=Decrypt
NEXT_PUBLIC_LEGACY_MEDIA_BASE=https://habbone.fr
DIRECTUS_FILES_FOLDER=435e0e4a-dda8-45a6-ad25-f3241a5ba02c
```
Add any extra variables you rely on locally (`DIRECTUS_FILES_FOLDER`, feature toggles, etc.). Ensure every secret differs from the local development values.

### 3.3 Build and run
```bash
pnpm build
pm2 start pnpm --name habbone-web -- start -- -p 3000
pm2 save
pm2 startup systemd  # first-time only
```

### 3.4 Reverse proxy with Nginx
Example `/etc/nginx/sites-available/habbone.conf`:
```nginx
server {
  listen 80;
  server_name app.domain.tld;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name app.domain.tld;

  ssl_certificate /etc/letsencrypt/live/app.domain.tld/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/app.domain.tld/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
Enable the site and request TLS certificates:
```bash
sudo ln -s /etc/nginx/sites-available/habbone.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo certbot --nginx -d app.domain.tld
```
Repeat with a second server block (or a distinct file) if you plan to expose Directus via `api.domain.tld`. Otherwise, keep port 8055 private and proxy only from Nginx.

## 4. Post-deployment checklist
- Visit `/forum`, `/news`, `/profile` to confirm Directus data is readable. Tail PM2 logs with `pm2 logs habbone-web` if necessary.
- Watch Directus logs with `docker compose logs -f directus` to catch CORS/auth errors.
- Enable firewall basics:
  ```bash
  sudo ufw allow OpenSSH
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- Schedule backups (`pg_dump` for PostgreSQL, rsync or snapshots for `/opt/directus/uploads`).
- Routine updates:
  ```bash
  cd /opt/directus && docker compose pull && docker compose up -d
  cd /var/www/habbone-admin/habbonedirectus && git pull && pnpm install && pnpm build && pm2 restart habbone-web
  ```

## 5. Troubleshooting reference
| Symptom | Quick fix |
|---------|-----------|
| `/forum` is empty | Ensure the Public role (or the service token role) can read `forum_cat` and `forum_topicos`. Re-check `DIRECTUS_SERVICE_TOKEN`. |
| `401` errors from Directus | Regenerate the service token or fix VPS time drift (install `chrony`). |
| Missing media | `NEXT_PUBLIC_DIRECTUS_URL` must point to the HTTPS public URL. Also confirm `STORAGE_LOCAL_ROOT` and public asset base align. |
| `500` on auth routes | `NEXTAUTH_SECRET` or `NEXTAUTH_URL` mismatched between build/runtime. |
| Upload failures | The `uploads` volume must be writable (`chown` on `/opt/directus/uploads`). |

---
Tip: keep a quick debug script (for example `pnpm tsx scripts/debug-forum.ts`) to log `listForumCategoriesService()` and `listForumTopicsWithCategories()` directly on the VPS whenever you need to validate the Directus API.*** End Patch
