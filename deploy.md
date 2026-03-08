# Master Deployment Guide: Healthcare RAG on AWS

This guide contains the complete, step-by-step instructions to deploy the Healthcare Hybrid RAG application on AWS using a secure 3-tier architecture with separate Public (Web) and Private (App) tiers.

---

## 🏗️ 1. Infrastructure (AWS Console)

### VPC & Networking
1.  **VPC**: Create `med-rag-vpc` (Range: `192.168.0.0/16`).
2.  **Subnets**:
    - **Public**: Two subnets (for Web Servers & ALBs).
    - **Private App**: Two subnets (for App Server, RDS, Redis).
3.  **NAT Gateway**: Create in a **Public Subnet** and update Private Subnet route tables to use it for internet access (so the App server can call OpenAI).

### Load Balancers (ALB)
1.  **Internal ALB** (`med-rag-internal-alb`):
    - **Scheme**: Internal.
    - **Subnets**: Private App Subnets.
    - **Security Group**: Allow Port 80 from **Web Server SG**.
    - **Target Group**: `app-server-tg` (Port 8000).
2.  **External ALB** (`med-rag-external-alb`):
    - **Scheme**: Internet-facing.
    - **Subnets**: Public Subnets.
    - **Security Group**: Allow Port 80 from `0.0.0.0/0`.
    - **Target Group**: `web-server-tg` (Port 80).
3.  **Important**: Set **Idle Timeout to 300 seconds** for BOTH ALBs in Attributes.

---

## 🗄️ 2. Managed Data Layer (RDS & Redis)

1.  **RDS (PostgreSQL)**:
    - Instance: `db.t3.micro`.
    - Engine: PostgreSQL.
    - Security Group: Allow Port 5432 from **App Server SG**.
2.  **ElastiCache (Redis)**:
    - Node: `cache.t3.micro`.
    - Security Group: Allow Port 6379 from **App Server SG**.

---

## 🔒 3. Private App Server (Backend)

### Initial Setup (Ubuntu 22.04 LTS)
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
```

### Resource Optimization (`t3.micro`)
Create a Swap file to prevent Out of Memory (OOM) crashes:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Deployment
1.  **Folder**: `mkdir ~/med-rag-backend && cd ~/med-rag-backend`.
2.  **Config**: Create `.env` with RDS URL, Redis URL, and OpenAI Key.
3.  **Permissions**: Give write access for FAISS:
    ```bash
    mkdir faiss_index
    sudo chmod -R 777 ~/med-rag-backend/faiss_index
    ```
4.  **Docker Compose** (`nano docker-compose.yml`):
    ```yaml
    version: "3.9"
    services:
      backend:
        image: divakar498/med-rag-backend:latest
        restart: always
        command: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
        ports:
          - "8000:8000"
        env_file:
          - .env
        volumes:
          - ./faiss_index:/app/faiss_index
    ```
5.  **Start**: `docker compose up -d`.

---

## 🌍 4. Public Web Server (Frontend + Nginx)

### Initial Setup
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install nginx -y
```

### Deployment
1.  **Docker Compose** (`~/med-rag-web/docker-compose.yml`):
    ```yaml
    version: "3.9"
    services:
      frontend:
        image: divakar498/med-rag-frontend:latest
        restart: always
        ports:
          - "3000:80"
    ```
2.  **Nginx Bridge** (`sudo nano /etc/nginx/sites-available/med_rag`):
    ```nginx
    server {
        listen 80;
        server_name _;
        client_max_body_size 100M;

        location / {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
        }

        location /api {
            proxy_read_timeout 300s;
            proxy_connect_timeout 300s;
            proxy_send_timeout 300s;
            proxy_pass http://[INTERNAL_ALB_DNS_NAME];
            proxy_set_header Host $host;
        }
    }
    ```
3.  **Enable Configuration**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/med_rag /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default
    sudo systemctl restart nginx
    docker compose up -d
    ```

---

## ✅ 5. Final Verification
1.  Visit the **External ALB DNS** in your browser.
2.  Upload a PDF guidelines document.
3.  Ask a question: "Who wrote this document?"
4.  Check for **RAG score** and **Source Chunks** in the response.

**Deployment Successful!**
